import type { Axis, ContentPoint, HexPoint, Vision } from "./types";

/**
 * Vision 坐标系（uvw）
 *
 * 在 react-hexgrid 的 cube 坐标系（qrs）之上封装的语义坐标，用方向定义轴，
 * 屏蔽"方向 → Δ → 锁定坐标"的间接链路。原点固定 (0,0,0)，移动只允许单步 +1/-1。
 *
 * 三轴定义（平顶 flat 布局，y 轴向下）：
 *
 *   轴   "+1" 方向   Δ(q,r,s)    锁定坐标    语义
 *   ----------------------------------------------------------------
 *   u    右上       (1,-1, 0)    s           up 轴
 *   v    正上       (0,-1, 1)    q           vision 轴（Vision 时序链）
 *   w    右下       (1, 0,-1)    r           workshop 轴
 *
 * 六个方向被 u/v/w 的正负向完全覆盖：
 *
 *   右上 u+1 | 正上 v+1 | 右下 w+1
 *   左下 u-1 | 正下 v-1 | 左上 w-1
 *
 * 约束继承自 cube：q+r+s=0，故 uvw 三轴代数不独立（秩 2），
 * 实际只需两轴定位，第三轴冗余。因每步 Δ 均满足 Δq+Δr+Δs=0，
 * 任意 uvw 移动组合的终点恒满足 cube 约束，不可能落入非法位置。
 *
 * 主轴直线生成规则：
 *   轴上第 i 个元素（i 从 0 起）= 原点走 (i+1) 步，坐标 = origin + delta*(i+1)
 *   u[i] = (q0+i+1, r0-i-1, s0)
 *   v[i] = (q0,     r0-i-1, s0+i+1)
 *   w[i] = (q0+i+1, r0,     s0-i-1)
 *
 * 不确定性占位节点（`...`）：
 *   轴上真实节点的身份可跳号（如 [..., w1, w2, ..., w5, w6, ...]），
 *   被跳过的部分用一个 `...` 节点显式占位，使「不确定性」可见。
 *   - `...` 是一个节点，占用一个数组 index，沿用 `step = index + 1` 的
 *     连续坐标规则；其「不连续」是语义层（真实身份跳号），而非坐标层。
 *   - `...` 节点数据形如 `{ id, status: "UNKNOWN" }`，Builder 透传 `status: "UNKNOWN"`，
 *     渲染层据此以无边框节点 + 文本 `...` 呈现，hover 时显示白色背景。
 *   - `...` 可出现在轴的任意位置。
 *
 * 局部轴以既有节点为锚点，沿 u/v/w 的正方向生成。解析过程允许多层锚定，
 * 并拒绝缺失锚点、循环依赖、重复节点 id 与坐标冲突。
 */

const ORIGIN: HexPoint = { q: 0, r: 0, s: 0 };

const AXIS_DELTA: Record<Axis, HexPoint> = {
  u: { q: 1, r: -1, s: 0 },
  v: { q: 0, r: -1, s: 1 },
  w: { q: 1, r: 0, s: -1 },
};

export function VisionBuilder(vision: Vision): ContentPoint[] {
  const points: ContentPoint[] = [];
  const pointById = new Map<string, ContentPoint>();
  const pointIdByCoordinate = new Map<string, string>();

  const vNodes = vision.v;
  const originIndex = vNodes.findIndex((node) => node.id === vision.a);
  if (originIndex === -1) {
    throw new Error(`Vision origin not found: vision.a="${vision.a}" not in v axis`);
  }
  const coordinateKey = (point: HexPoint) => `${point.q},${point.r},${point.s}`;
  const addPoint = (point: ContentPoint) => {
    if (pointById.has(point.id)) {
      throw new Error(`Duplicate Vision node id: "${point.id}"`);
    }

    const key = coordinateKey(point);
    const occupiedBy = pointIdByCoordinate.get(key);
    if (occupiedBy) {
      throw new Error(`Vision coordinate collision: "${point.id}" and "${occupiedBy}" at ${key}`);
    }

    points.push(point);
    pointById.set(point.id, point);
    pointIdByCoordinate.set(key, point.id);
  };

  const AXES: Axis[] = ["u", "v", "w"];
  AXES.forEach((axis) => {
    const delta = AXIS_DELTA[axis];
    if (axis === "v") {
      vNodes.forEach((node, index) => {
        const step = index - originIndex;
        addPoint({
          id: node.id,
          name: node.name,
          status: node.status,
          axis,
          q: ORIGIN.q + delta.q * step,
          r: ORIGIN.r + delta.r * step,
          s: ORIGIN.s + delta.s * step,
        });
      });
    } else {
      vision[axis].forEach((node, index) => {
        const step = index + 1;
        addPoint({
          id: node.id,
          name: node.name,
          status: node.status,
          axis,
          q: ORIGIN.q + delta.q * step,
          r: ORIGIN.r + delta.r * step,
          s: ORIGIN.s + delta.s * step,
        });
      });
    }
  });

  const pendingAxes = [...(vision.axes ?? [])];
  while (pendingAxes.length > 0) {
    let resolvedInPass = 0;

    for (let index = pendingAxes.length - 1; index >= 0; index -= 1) {
      const anchoredAxis = pendingAxes[index];
      const anchor = pointById.get(anchoredAxis.anchorId);
      if (!anchor) continue;

      AXES.forEach((axis) => {
        const delta = AXIS_DELTA[axis];
        (anchoredAxis[axis] ?? []).forEach((node, nodeIndex) => {
          const step = nodeIndex + 1;
          addPoint({
            id: node.id,
            name: node.name,
            status: node.status,
            axis,
            q: anchor.q + delta.q * step,
            r: anchor.r + delta.r * step,
            s: anchor.s + delta.s * step,
          });
        });
      });

      pendingAxes.splice(index, 1);
      resolvedInPass += 1;
    }

    if (resolvedInPass === 0) {
      const unresolved = pendingAxes.map((axis) => axis.anchorId).join(", ");
      throw new Error(`Unresolved Vision axis anchors: ${unresolved}`);
    }
  }

  return points;
}
