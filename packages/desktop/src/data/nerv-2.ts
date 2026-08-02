import type {
  AxisCanvasNode,
  Axis,
  CanvasNode,
  HexPoint,
  Vision,
} from "../features/vision/types";

/**
 * Vision 模拟数据。
 *
 * 手动编辑此文件即可生效，无需改动组件逻辑。
 * - `a` 标记原点 Vision 的 id，指向 v 轴数组中对应元素。
 * - v 轴存在正负轴：原点之前为负轴（正下），原点之后为正轴（正上）。
 * - u/w 轴只正轴，挂在原点上。
 * - `status: null` 表示不确定性占位节点（`•••`），每条轴至多一个（后端控制）。
 */
export const a: Vision = {
  a: "VISION-003",
  v: [
    { id: "VISION-002", name: "重启 backstage.js 项目", status: "TODO" },
    { id: "VISION-003", name: "优化 Gitlab 的读取", status: "TODO" },
    { id: "v-ellipsis", status: null },
    { id: "VISION-001", name: "重启 backstage.js 项目，优化 Gitlab 的读取", status: "TODO" },
  ],
  u: [
    { id: "u1", status: "PASS" },
    { id: "u2", status: "TODO" },
    { id: "u-ellipsis", status: null },
    { id: "u5", status: "FAIL" },
    { id: "u6", status: "PASS" },
  ],
  w: [
    { id: "w1", status: "TODO" },
    { id: "w2", status: "PASS" },
    { id: "w3", status: "FAIL" },
    { id: "w-ellipsis", status: null },
    { id: "w7", status: "HOLD" },
    { id: "w8", status: "TODO" },
    { id: "w9", status: "PASS" },
    { id: "w-ellipsis-2", status: null },
    { id: "w13", status: "HOLD" },
    { id: "w14", status: "PASS" },
    { id: "w15", status: "TODO" },
    { id: "w16", status: "FAIL" },
    { id: "w17", status: "PASS" },
  ],
};

const ORIGIN: HexPoint = { q: 0, r: 0, s: 0 };

const AXIS_DELTA: Record<Axis, HexPoint> = {
  u: { q: 1, r: -1, s: 0 },
  v: { q: 0, r: -1, s: 1 },
  w: { q: 1, r: 0, s: -1 },
};

const HEX_DIRECTIONS: HexPoint[] = [
  { q: 1, r: 0, s: -1 },
  { q: 1, r: -1, s: 0 },
  { q: 0, r: -1, s: 1 },
  { q: -1, r: 0, s: 1 },
  { q: -1, r: 1, s: 0 },
  { q: 0, r: 1, s: -1 },
];

const GRID_CONFIG = {
  viewBox: { x: -60, y: -50, width: 200, height: 100 },
  size: 4,
  spacing: 1.15,
  probability: {
    minimum: 0.07,
    originWeight: 0.58,
    originDecay: 6,
    wAxisWeight: 0.28,
    wAxisDecay: 1.6,
    maximum: 0.94,
  },
} as const;

function pointKey(point: HexPoint): string {
  return `${point.q},${point.r},${point.s}`;
}

function buildVisionPoints(vision: Vision): AxisCanvasNode[] {
  const originIndex = vision.v.findIndex((node) => node.id === vision.a);
  if (originIndex === -1) {
    throw new Error(`Vision origin not found: vision.a="${vision.a}" not in v axis`);
  }

  const points: AxisCanvasNode[] = [];
  const axes: Axis[] = ["u", "v", "w"];

  axes.forEach((axis) => {
    const delta = AXIS_DELTA[axis];
    vision[axis].forEach((node, index) => {
      if (axis === "v" && index === originIndex) {
        points.push({ type: axis, ...node, isOrigin: true, ...ORIGIN });
        return;
      }

      const step = axis === "v" ? index - originIndex : index + 1;
      points.push({
        type: axis,
        ...node,
        q: delta.q * step,
        r: delta.r * step,
        s: delta.s * step,
      });
    });
  });

  return points;
}

function visibleGridPoints(): HexPoint[] {
  const { viewBox, size, spacing } = GRID_CONFIG;
  const horizontalStep = 1.5 * size * spacing;
  const qVerticalStep = (Math.sqrt(3) / 2) * size * spacing;
  const rVerticalStep = Math.sqrt(3) * size * spacing;
  const verticalRadius = (Math.sqrt(3) / 2) * size;
  const minQ = Math.ceil((viewBox.x - size) / horizontalStep);
  const maxQ = Math.floor((viewBox.x + viewBox.width + size) / horizontalStep);
  const points: HexPoint[] = [];

  for (let q = minQ; q <= maxQ; q += 1) {
    const qOffset = qVerticalStep * q;
    const minR = Math.ceil((viewBox.y - verticalRadius - qOffset) / rVerticalStep);
    const maxR = Math.floor((viewBox.y + viewBox.height + verticalRadius - qOffset) / rVerticalStep);
    for (let r = minR; r <= maxR; r += 1) {
      points.push({ q, r, s: -q - r });
    }
  }

  return points;
}

function distanceFromOrigin(point: HexPoint): number {
  return (Math.abs(point.q) + Math.abs(point.r) + Math.abs(point.s)) / 2;
}

function randomAt(seed: number, point: HexPoint): number {
  let value = (
    seed
    ^ Math.imul(point.q, 73856093)
    ^ Math.imul(point.r, 19349663)
    ^ Math.imul(point.s, 83492791)
  ) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
}

function renderProbability(point: HexPoint): number {
  const distance = distanceFromOrigin(point);
  const wAxisDistance = point.q >= 0 ? Math.abs(point.r) : distance;
  const probability = GRID_CONFIG.probability;
  const weighted = probability.minimum
    + probability.originWeight * Math.exp(-distance / probability.originDecay)
    + probability.wAxisWeight * Math.exp(-wAxisDistance / probability.wAxisDecay);
  return Math.min(probability.maximum, weighted);
}

/**
 * 离线生成静态 b。应用代码不调用此函数；调整算法后由 Agent 调用并替换 b。
 */
export function genRndB(seed = 20260802): CanvasNode[] {
  const nodes = buildVisionPoints(a);
  const nodeKeys = new Set(nodes.map(pointKey));
  const selectedEmptyPoints = visibleGridPoints().filter((point) => (
    !nodeKeys.has(pointKey(point)) && randomAt(seed, point) < renderProbability(point)
  ));
  const selectedKeys = new Set([...nodeKeys, ...selectedEmptyPoints.map(pointKey)]);
  const connectedKeys = new Set([pointKey(ORIGIN)]);
  const queue: HexPoint[] = [ORIGIN];

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    HEX_DIRECTIONS.forEach((direction) => {
      const neighbor = {
        q: current.q + direction.q,
        r: current.r + direction.r,
        s: current.s + direction.s,
      };
      const key = pointKey(neighbor);
      if (selectedKeys.has(key) && !connectedKeys.has(key)) {
        connectedKeys.add(key);
        queue.push(neighbor);
      }
    });
  }

  const persistentKeys = new Set(
    selectedEmptyPoints
      .filter((point) => connectedKeys.has(pointKey(point)))
      .map(pointKey),
  );
  const emptyPoints = visibleGridPoints()
    .filter((point) => !nodeKeys.has(pointKey(point)))
    .map((point) => ({
      type: "empty" as const,
      presentation: persistentKeys.has(pointKey(point)) ? "persistent" as const : "hover" as const,
      ...point,
    }));

  return [...emptyPoints, ...nodes];
}

export const b: CanvasNode[] = [
  { type: "empty", presentation: "hover", q: -9, r: -2, s: 11 },
  { type: "empty", presentation: "hover", q: -9, r: -1, s: 10 },
  { type: "empty", presentation: "hover", q: -9, r: 0, s: 9 },
  { type: "empty", presentation: "hover", q: -9, r: 1, s: 8 },
  { type: "empty", presentation: "hover", q: -9, r: 2, s: 7 },
  { type: "empty", presentation: "hover", q: -9, r: 3, s: 6 },
  { type: "empty", presentation: "hover", q: -9, r: 4, s: 5 },
  { type: "empty", presentation: "hover", q: -9, r: 5, s: 4 },
  { type: "empty", presentation: "hover", q: -9, r: 6, s: 3 },
  { type: "empty", presentation: "hover", q: -9, r: 7, s: 2 },
  { type: "empty", presentation: "hover", q: -9, r: 8, s: 1 },
  { type: "empty", presentation: "hover", q: -9, r: 9, s: 0 },
  { type: "empty", presentation: "hover", q: -9, r: 10, s: -1 },
  { type: "empty", presentation: "hover", q: -9, r: 11, s: -2 },
  { type: "empty", presentation: "hover", q: -8, r: -2, s: 10 },
  { type: "empty", presentation: "hover", q: -8, r: -1, s: 9 },
  { type: "empty", presentation: "hover", q: -8, r: 0, s: 8 },
  { type: "empty", presentation: "hover", q: -8, r: 1, s: 7 },
  { type: "empty", presentation: "hover", q: -8, r: 2, s: 6 },
  { type: "empty", presentation: "hover", q: -8, r: 3, s: 5 },
  { type: "empty", presentation: "hover", q: -8, r: 4, s: 4 },
  { type: "empty", presentation: "hover", q: -8, r: 5, s: 3 },
  { type: "empty", presentation: "hover", q: -8, r: 6, s: 2 },
  { type: "empty", presentation: "hover", q: -8, r: 7, s: 1 },
  { type: "empty", presentation: "hover", q: -8, r: 8, s: 0 },
  { type: "empty", presentation: "hover", q: -8, r: 9, s: -1 },
  { type: "empty", presentation: "hover", q: -8, r: 10, s: -2 },
  { type: "empty", presentation: "hover", q: -7, r: -3, s: 10 },
  { type: "empty", presentation: "hover", q: -7, r: -2, s: 9 },
  { type: "empty", presentation: "hover", q: -7, r: -1, s: 8 },
  { type: "empty", presentation: "hover", q: -7, r: 0, s: 7 },
  { type: "empty", presentation: "hover", q: -7, r: 1, s: 6 },
  { type: "empty", presentation: "hover", q: -7, r: 2, s: 5 },
  { type: "empty", presentation: "hover", q: -7, r: 3, s: 4 },
  { type: "empty", presentation: "hover", q: -7, r: 4, s: 3 },
  { type: "empty", presentation: "hover", q: -7, r: 5, s: 2 },
  { type: "empty", presentation: "hover", q: -7, r: 6, s: 1 },
  { type: "empty", presentation: "hover", q: -7, r: 7, s: 0 },
  { type: "empty", presentation: "hover", q: -7, r: 8, s: -1 },
  { type: "empty", presentation: "hover", q: -7, r: 9, s: -2 },
  { type: "empty", presentation: "hover", q: -7, r: 10, s: -3 },
  { type: "empty", presentation: "hover", q: -6, r: -3, s: 9 },
  { type: "empty", presentation: "hover", q: -6, r: -2, s: 8 },
  { type: "empty", presentation: "hover", q: -6, r: -1, s: 7 },
  { type: "empty", presentation: "hover", q: -6, r: 0, s: 6 },
  { type: "empty", presentation: "hover", q: -6, r: 1, s: 5 },
  { type: "empty", presentation: "hover", q: -6, r: 2, s: 4 },
  { type: "empty", presentation: "hover", q: -6, r: 3, s: 3 },
  { type: "empty", presentation: "hover", q: -6, r: 4, s: 2 },
  { type: "empty", presentation: "hover", q: -6, r: 5, s: 1 },
  { type: "empty", presentation: "hover", q: -6, r: 6, s: 0 },
  { type: "empty", presentation: "hover", q: -6, r: 7, s: -1 },
  { type: "empty", presentation: "hover", q: -6, r: 8, s: -2 },
  { type: "empty", presentation: "hover", q: -6, r: 9, s: -3 },
  { type: "empty", presentation: "hover", q: -5, r: -4, s: 9 },
  { type: "empty", presentation: "persistent", q: -5, r: -3, s: 8 },
  { type: "empty", presentation: "hover", q: -5, r: -2, s: 7 },
  { type: "empty", presentation: "hover", q: -5, r: -1, s: 6 },
  { type: "empty", presentation: "hover", q: -5, r: 0, s: 5 },
  { type: "empty", presentation: "hover", q: -5, r: 1, s: 4 },
  { type: "empty", presentation: "hover", q: -5, r: 2, s: 3 },
  { type: "empty", presentation: "hover", q: -5, r: 3, s: 2 },
  { type: "empty", presentation: "hover", q: -5, r: 4, s: 1 },
  { type: "empty", presentation: "hover", q: -5, r: 5, s: 0 },
  { type: "empty", presentation: "hover", q: -5, r: 6, s: -1 },
  { type: "empty", presentation: "hover", q: -5, r: 7, s: -2 },
  { type: "empty", presentation: "hover", q: -5, r: 8, s: -3 },
  { type: "empty", presentation: "hover", q: -5, r: 9, s: -4 },
  { type: "empty", presentation: "hover", q: -4, r: -4, s: 8 },
  { type: "empty", presentation: "persistent", q: -4, r: -3, s: 7 },
  { type: "empty", presentation: "persistent", q: -4, r: -2, s: 6 },
  { type: "empty", presentation: "persistent", q: -4, r: -1, s: 5 },
  { type: "empty", presentation: "hover", q: -4, r: 0, s: 4 },
  { type: "empty", presentation: "hover", q: -4, r: 1, s: 3 },
  { type: "empty", presentation: "persistent", q: -4, r: 2, s: 2 },
  { type: "empty", presentation: "persistent", q: -4, r: 3, s: 1 },
  { type: "empty", presentation: "persistent", q: -4, r: 4, s: 0 },
  { type: "empty", presentation: "hover", q: -4, r: 5, s: -1 },
  { type: "empty", presentation: "hover", q: -4, r: 6, s: -2 },
  { type: "empty", presentation: "persistent", q: -4, r: 7, s: -3 },
  { type: "empty", presentation: "hover", q: -4, r: 8, s: -4 },
  { type: "empty", presentation: "hover", q: -3, r: -5, s: 8 },
  { type: "empty", presentation: "hover", q: -3, r: -4, s: 7 },
  { type: "empty", presentation: "hover", q: -3, r: -3, s: 6 },
  { type: "empty", presentation: "persistent", q: -3, r: -2, s: 5 },
  { type: "empty", presentation: "hover", q: -3, r: -1, s: 4 },
  { type: "empty", presentation: "persistent", q: -3, r: 0, s: 3 },
  { type: "empty", presentation: "persistent", q: -3, r: 1, s: 2 },
  { type: "empty", presentation: "hover", q: -3, r: 2, s: 1 },
  { type: "empty", presentation: "persistent", q: -3, r: 3, s: 0 },
  { type: "empty", presentation: "hover", q: -3, r: 4, s: -1 },
  { type: "empty", presentation: "hover", q: -3, r: 5, s: -2 },
  { type: "empty", presentation: "persistent", q: -3, r: 6, s: -3 },
  { type: "empty", presentation: "persistent", q: -3, r: 7, s: -4 },
  { type: "empty", presentation: "hover", q: -3, r: 8, s: -5 },
  { type: "empty", presentation: "hover", q: -2, r: -5, s: 7 },
  { type: "empty", presentation: "hover", q: -2, r: -4, s: 6 },
  { type: "empty", presentation: "hover", q: -2, r: -3, s: 5 },
  { type: "empty", presentation: "persistent", q: -2, r: -2, s: 4 },
  { type: "empty", presentation: "hover", q: -2, r: -1, s: 3 },
  { type: "empty", presentation: "persistent", q: -2, r: 0, s: 2 },
  { type: "empty", presentation: "persistent", q: -2, r: 1, s: 1 },
  { type: "empty", presentation: "persistent", q: -2, r: 2, s: 0 },
  { type: "empty", presentation: "persistent", q: -2, r: 3, s: -1 },
  { type: "empty", presentation: "hover", q: -2, r: 4, s: -2 },
  { type: "empty", presentation: "persistent", q: -2, r: 5, s: -3 },
  { type: "empty", presentation: "persistent", q: -2, r: 6, s: -4 },
  { type: "empty", presentation: "persistent", q: -2, r: 7, s: -5 },
  { type: "empty", presentation: "hover", q: -1, r: -6, s: 7 },
  { type: "empty", presentation: "hover", q: -1, r: -5, s: 6 },
  { type: "empty", presentation: "persistent", q: -1, r: -4, s: 5 },
  { type: "empty", presentation: "persistent", q: -1, r: -3, s: 4 },
  { type: "empty", presentation: "hover", q: -1, r: -2, s: 3 },
  { type: "empty", presentation: "hover", q: -1, r: -1, s: 2 },
  { type: "empty", presentation: "persistent", q: -1, r: 0, s: 1 },
  { type: "empty", presentation: "persistent", q: -1, r: 1, s: 0 },
  { type: "empty", presentation: "persistent", q: -1, r: 2, s: -1 },
  { type: "empty", presentation: "persistent", q: -1, r: 3, s: -2 },
  { type: "empty", presentation: "persistent", q: -1, r: 4, s: -3 },
  { type: "empty", presentation: "persistent", q: -1, r: 5, s: -4 },
  { type: "empty", presentation: "hover", q: -1, r: 6, s: -5 },
  { type: "empty", presentation: "hover", q: -1, r: 7, s: -6 },
  { type: "empty", presentation: "persistent", q: 0, r: -6, s: 6 },
  { type: "empty", presentation: "persistent", q: 0, r: -5, s: 5 },
  { type: "empty", presentation: "hover", q: 0, r: -4, s: 4 },
  { type: "empty", presentation: "persistent", q: 0, r: -3, s: 3 },
  { type: "empty", presentation: "persistent", q: 0, r: 2, s: -2 },
  { type: "empty", presentation: "persistent", q: 0, r: 3, s: -3 },
  { type: "empty", presentation: "hover", q: 0, r: 4, s: -4 },
  { type: "empty", presentation: "persistent", q: 0, r: 5, s: -5 },
  { type: "empty", presentation: "persistent", q: 0, r: 6, s: -6 },
  { type: "empty", presentation: "hover", q: 1, r: -7, s: 6 },
  { type: "empty", presentation: "hover", q: 1, r: -6, s: 5 },
  { type: "empty", presentation: "hover", q: 1, r: -5, s: 4 },
  { type: "empty", presentation: "persistent", q: 1, r: -4, s: 3 },
  { type: "empty", presentation: "persistent", q: 1, r: -3, s: 2 },
  { type: "empty", presentation: "persistent", q: 1, r: -2, s: 1 },
  { type: "empty", presentation: "persistent", q: 1, r: 1, s: -2 },
  { type: "empty", presentation: "hover", q: 1, r: 2, s: -3 },
  { type: "empty", presentation: "persistent", q: 1, r: 3, s: -4 },
  { type: "empty", presentation: "hover", q: 1, r: 4, s: -5 },
  { type: "empty", presentation: "hover", q: 1, r: 5, s: -6 },
  { type: "empty", presentation: "hover", q: 1, r: 6, s: -7 },
  { type: "empty", presentation: "hover", q: 2, r: -7, s: 5 },
  { type: "empty", presentation: "hover", q: 2, r: -6, s: 4 },
  { type: "empty", presentation: "hover", q: 2, r: -5, s: 3 },
  { type: "empty", presentation: "persistent", q: 2, r: -4, s: 2 },
  { type: "empty", presentation: "persistent", q: 2, r: -3, s: 1 },
  { type: "empty", presentation: "hover", q: 2, r: -1, s: -1 },
  { type: "empty", presentation: "hover", q: 2, r: 1, s: -3 },
  { type: "empty", presentation: "persistent", q: 2, r: 2, s: -4 },
  { type: "empty", presentation: "hover", q: 2, r: 3, s: -5 },
  { type: "empty", presentation: "hover", q: 2, r: 4, s: -6 },
  { type: "empty", presentation: "hover", q: 2, r: 5, s: -7 },
  { type: "empty", presentation: "hover", q: 3, r: -8, s: 5 },
  { type: "empty", presentation: "hover", q: 3, r: -7, s: 4 },
  { type: "empty", presentation: "hover", q: 3, r: -6, s: 3 },
  { type: "empty", presentation: "hover", q: 3, r: -5, s: 2 },
  { type: "empty", presentation: "hover", q: 3, r: -4, s: 1 },
  { type: "empty", presentation: "hover", q: 3, r: -2, s: -1 },
  { type: "empty", presentation: "hover", q: 3, r: -1, s: -2 },
  { type: "empty", presentation: "hover", q: 3, r: 1, s: -4 },
  { type: "empty", presentation: "hover", q: 3, r: 2, s: -5 },
  { type: "empty", presentation: "hover", q: 3, r: 3, s: -6 },
  { type: "empty", presentation: "hover", q: 3, r: 4, s: -7 },
  { type: "empty", presentation: "hover", q: 3, r: 5, s: -8 },
  { type: "empty", presentation: "hover", q: 4, r: -8, s: 4 },
  { type: "empty", presentation: "hover", q: 4, r: -7, s: 3 },
  { type: "empty", presentation: "hover", q: 4, r: -6, s: 2 },
  { type: "empty", presentation: "persistent", q: 4, r: -5, s: 1 },
  { type: "empty", presentation: "hover", q: 4, r: -3, s: -1 },
  { type: "empty", presentation: "hover", q: 4, r: -2, s: -2 },
  { type: "empty", presentation: "hover", q: 4, r: -1, s: -3 },
  { type: "empty", presentation: "hover", q: 4, r: 1, s: -5 },
  { type: "empty", presentation: "hover", q: 4, r: 2, s: -6 },
  { type: "empty", presentation: "hover", q: 4, r: 3, s: -7 },
  { type: "empty", presentation: "hover", q: 4, r: 4, s: -8 },
  { type: "empty", presentation: "hover", q: 5, r: -9, s: 4 },
  { type: "empty", presentation: "hover", q: 5, r: -8, s: 3 },
  { type: "empty", presentation: "hover", q: 5, r: -7, s: 2 },
  { type: "empty", presentation: "hover", q: 5, r: -6, s: 1 },
  { type: "empty", presentation: "hover", q: 5, r: -4, s: -1 },
  { type: "empty", presentation: "hover", q: 5, r: -3, s: -2 },
  { type: "empty", presentation: "persistent", q: 5, r: -2, s: -3 },
  { type: "empty", presentation: "persistent", q: 5, r: -1, s: -4 },
  { type: "empty", presentation: "hover", q: 5, r: 1, s: -6 },
  { type: "empty", presentation: "hover", q: 5, r: 2, s: -7 },
  { type: "empty", presentation: "hover", q: 5, r: 3, s: -8 },
  { type: "empty", presentation: "hover", q: 5, r: 4, s: -9 },
  { type: "empty", presentation: "hover", q: 6, r: -9, s: 3 },
  { type: "empty", presentation: "hover", q: 6, r: -8, s: 2 },
  { type: "empty", presentation: "hover", q: 6, r: -7, s: 1 },
  { type: "empty", presentation: "persistent", q: 6, r: -6, s: 0 },
  { type: "empty", presentation: "hover", q: 6, r: -5, s: -1 },
  { type: "empty", presentation: "persistent", q: 6, r: -4, s: -2 },
  { type: "empty", presentation: "persistent", q: 6, r: -3, s: -3 },
  { type: "empty", presentation: "persistent", q: 6, r: -2, s: -4 },
  { type: "empty", presentation: "persistent", q: 6, r: -1, s: -5 },
  { type: "empty", presentation: "persistent", q: 6, r: 1, s: -7 },
  { type: "empty", presentation: "hover", q: 6, r: 2, s: -8 },
  { type: "empty", presentation: "hover", q: 6, r: 3, s: -9 },
  { type: "empty", presentation: "hover", q: 7, r: -10, s: 3 },
  { type: "empty", presentation: "hover", q: 7, r: -9, s: 2 },
  { type: "empty", presentation: "hover", q: 7, r: -8, s: 1 },
  { type: "empty", presentation: "hover", q: 7, r: -7, s: 0 },
  { type: "empty", presentation: "persistent", q: 7, r: -6, s: -1 },
  { type: "empty", presentation: "hover", q: 7, r: -5, s: -2 },
  { type: "empty", presentation: "hover", q: 7, r: -4, s: -3 },
  { type: "empty", presentation: "hover", q: 7, r: -3, s: -4 },
  { type: "empty", presentation: "persistent", q: 7, r: -2, s: -5 },
  { type: "empty", presentation: "hover", q: 7, r: -1, s: -6 },
  { type: "empty", presentation: "persistent", q: 7, r: 1, s: -8 },
  { type: "empty", presentation: "hover", q: 7, r: 2, s: -9 },
  { type: "empty", presentation: "hover", q: 7, r: 3, s: -10 },
  { type: "empty", presentation: "hover", q: 8, r: -10, s: 2 },
  { type: "empty", presentation: "hover", q: 8, r: -9, s: 1 },
  { type: "empty", presentation: "hover", q: 8, r: -8, s: 0 },
  { type: "empty", presentation: "hover", q: 8, r: -7, s: -1 },
  { type: "empty", presentation: "hover", q: 8, r: -6, s: -2 },
  { type: "empty", presentation: "hover", q: 8, r: -5, s: -3 },
  { type: "empty", presentation: "hover", q: 8, r: -4, s: -4 },
  { type: "empty", presentation: "hover", q: 8, r: -3, s: -5 },
  { type: "empty", presentation: "persistent", q: 8, r: -2, s: -6 },
  { type: "empty", presentation: "hover", q: 8, r: -1, s: -7 },
  { type: "empty", presentation: "persistent", q: 8, r: 1, s: -9 },
  { type: "empty", presentation: "hover", q: 8, r: 2, s: -10 },
  { type: "empty", presentation: "hover", q: 9, r: -11, s: 2 },
  { type: "empty", presentation: "hover", q: 9, r: -10, s: 1 },
  { type: "empty", presentation: "hover", q: 9, r: -9, s: 0 },
  { type: "empty", presentation: "hover", q: 9, r: -8, s: -1 },
  { type: "empty", presentation: "hover", q: 9, r: -7, s: -2 },
  { type: "empty", presentation: "hover", q: 9, r: -6, s: -3 },
  { type: "empty", presentation: "hover", q: 9, r: -5, s: -4 },
  { type: "empty", presentation: "hover", q: 9, r: -4, s: -5 },
  { type: "empty", presentation: "hover", q: 9, r: -3, s: -6 },
  { type: "empty", presentation: "hover", q: 9, r: -2, s: -7 },
  { type: "empty", presentation: "persistent", q: 9, r: -1, s: -8 },
  { type: "empty", presentation: "hover", q: 9, r: 1, s: -10 },
  { type: "empty", presentation: "hover", q: 9, r: 2, s: -11 },
  { type: "empty", presentation: "hover", q: 10, r: -11, s: 1 },
  { type: "empty", presentation: "hover", q: 10, r: -10, s: 0 },
  { type: "empty", presentation: "hover", q: 10, r: -9, s: -1 },
  { type: "empty", presentation: "hover", q: 10, r: -8, s: -2 },
  { type: "empty", presentation: "hover", q: 10, r: -7, s: -3 },
  { type: "empty", presentation: "hover", q: 10, r: -6, s: -4 },
  { type: "empty", presentation: "hover", q: 10, r: -5, s: -5 },
  { type: "empty", presentation: "hover", q: 10, r: -4, s: -6 },
  { type: "empty", presentation: "hover", q: 10, r: -3, s: -7 },
  { type: "empty", presentation: "hover", q: 10, r: -2, s: -8 },
  { type: "empty", presentation: "hover", q: 10, r: -1, s: -9 },
  { type: "empty", presentation: "hover", q: 10, r: 1, s: -11 },
  { type: "empty", presentation: "hover", q: 11, r: -12, s: 1 },
  { type: "empty", presentation: "hover", q: 11, r: -11, s: 0 },
  { type: "empty", presentation: "hover", q: 11, r: -10, s: -1 },
  { type: "empty", presentation: "hover", q: 11, r: -9, s: -2 },
  { type: "empty", presentation: "hover", q: 11, r: -8, s: -3 },
  { type: "empty", presentation: "hover", q: 11, r: -7, s: -4 },
  { type: "empty", presentation: "hover", q: 11, r: -6, s: -5 },
  { type: "empty", presentation: "hover", q: 11, r: -5, s: -6 },
  { type: "empty", presentation: "hover", q: 11, r: -4, s: -7 },
  { type: "empty", presentation: "hover", q: 11, r: -3, s: -8 },
  { type: "empty", presentation: "hover", q: 11, r: -2, s: -9 },
  { type: "empty", presentation: "hover", q: 11, r: -1, s: -10 },
  { type: "empty", presentation: "hover", q: 11, r: 1, s: -12 },
  { type: "empty", presentation: "hover", q: 12, r: -12, s: 0 },
  { type: "empty", presentation: "hover", q: 12, r: -11, s: -1 },
  { type: "empty", presentation: "hover", q: 12, r: -10, s: -2 },
  { type: "empty", presentation: "hover", q: 12, r: -9, s: -3 },
  { type: "empty", presentation: "hover", q: 12, r: -8, s: -4 },
  { type: "empty", presentation: "hover", q: 12, r: -7, s: -5 },
  { type: "empty", presentation: "hover", q: 12, r: -6, s: -6 },
  { type: "empty", presentation: "hover", q: 12, r: -5, s: -7 },
  { type: "empty", presentation: "hover", q: 12, r: -4, s: -8 },
  { type: "empty", presentation: "hover", q: 12, r: -3, s: -9 },
  { type: "empty", presentation: "hover", q: 12, r: -2, s: -10 },
  { type: "empty", presentation: "hover", q: 12, r: -1, s: -11 },
  { type: "empty", presentation: "hover", q: 13, r: -13, s: 0 },
  { type: "empty", presentation: "hover", q: 13, r: -12, s: -1 },
  { type: "empty", presentation: "hover", q: 13, r: -11, s: -2 },
  { type: "empty", presentation: "hover", q: 13, r: -10, s: -3 },
  { type: "empty", presentation: "hover", q: 13, r: -9, s: -4 },
  { type: "empty", presentation: "hover", q: 13, r: -8, s: -5 },
  { type: "empty", presentation: "hover", q: 13, r: -7, s: -6 },
  { type: "empty", presentation: "hover", q: 13, r: -6, s: -7 },
  { type: "empty", presentation: "hover", q: 13, r: -5, s: -8 },
  { type: "empty", presentation: "hover", q: 13, r: -4, s: -9 },
  { type: "empty", presentation: "hover", q: 13, r: -3, s: -10 },
  { type: "empty", presentation: "hover", q: 13, r: -2, s: -11 },
  { type: "empty", presentation: "hover", q: 13, r: -1, s: -12 },
  { type: "empty", presentation: "hover", q: 14, r: -13, s: -1 },
  { type: "empty", presentation: "hover", q: 14, r: -12, s: -2 },
  { type: "empty", presentation: "hover", q: 14, r: -11, s: -3 },
  { type: "empty", presentation: "hover", q: 14, r: -10, s: -4 },
  { type: "empty", presentation: "hover", q: 14, r: -9, s: -5 },
  { type: "empty", presentation: "hover", q: 14, r: -8, s: -6 },
  { type: "empty", presentation: "hover", q: 14, r: -7, s: -7 },
  { type: "empty", presentation: "hover", q: 14, r: -6, s: -8 },
  { type: "empty", presentation: "hover", q: 14, r: -5, s: -9 },
  { type: "empty", presentation: "hover", q: 14, r: -4, s: -10 },
  { type: "empty", presentation: "hover", q: 14, r: -3, s: -11 },
  { type: "empty", presentation: "hover", q: 14, r: -2, s: -12 },
  { type: "empty", presentation: "persistent", q: 14, r: -1, s: -13 },
  { type: "empty", presentation: "hover", q: 15, r: -14, s: -1 },
  { type: "empty", presentation: "hover", q: 15, r: -13, s: -2 },
  { type: "empty", presentation: "hover", q: 15, r: -12, s: -3 },
  { type: "empty", presentation: "hover", q: 15, r: -11, s: -4 },
  { type: "empty", presentation: "hover", q: 15, r: -10, s: -5 },
  { type: "empty", presentation: "hover", q: 15, r: -9, s: -6 },
  { type: "empty", presentation: "hover", q: 15, r: -8, s: -7 },
  { type: "empty", presentation: "hover", q: 15, r: -7, s: -8 },
  { type: "empty", presentation: "hover", q: 15, r: -6, s: -9 },
  { type: "empty", presentation: "hover", q: 15, r: -5, s: -10 },
  { type: "empty", presentation: "hover", q: 15, r: -4, s: -11 },
  { type: "empty", presentation: "hover", q: 15, r: -3, s: -12 },
  { type: "empty", presentation: "hover", q: 15, r: -2, s: -13 },
  { type: "empty", presentation: "hover", q: 15, r: -1, s: -14 },
  { type: "empty", presentation: "hover", q: 16, r: -14, s: -2 },
  { type: "empty", presentation: "hover", q: 16, r: -13, s: -3 },
  { type: "empty", presentation: "hover", q: 16, r: -12, s: -4 },
  { type: "empty", presentation: "hover", q: 16, r: -11, s: -5 },
  { type: "empty", presentation: "hover", q: 16, r: -10, s: -6 },
  { type: "empty", presentation: "hover", q: 16, r: -9, s: -7 },
  { type: "empty", presentation: "hover", q: 16, r: -8, s: -8 },
  { type: "empty", presentation: "hover", q: 16, r: -7, s: -9 },
  { type: "empty", presentation: "hover", q: 16, r: -6, s: -10 },
  { type: "empty", presentation: "hover", q: 16, r: -5, s: -11 },
  { type: "empty", presentation: "hover", q: 16, r: -4, s: -12 },
  { type: "empty", presentation: "hover", q: 16, r: -3, s: -13 },
  { type: "empty", presentation: "hover", q: 16, r: -2, s: -14 },
  { type: "empty", presentation: "hover", q: 17, r: -15, s: -2 },
  { type: "empty", presentation: "hover", q: 17, r: -14, s: -3 },
  { type: "empty", presentation: "hover", q: 17, r: -13, s: -4 },
  { type: "empty", presentation: "hover", q: 17, r: -12, s: -5 },
  { type: "empty", presentation: "hover", q: 17, r: -11, s: -6 },
  { type: "empty", presentation: "hover", q: 17, r: -10, s: -7 },
  { type: "empty", presentation: "hover", q: 17, r: -9, s: -8 },
  { type: "empty", presentation: "hover", q: 17, r: -8, s: -9 },
  { type: "empty", presentation: "hover", q: 17, r: -7, s: -10 },
  { type: "empty", presentation: "hover", q: 17, r: -6, s: -11 },
  { type: "empty", presentation: "hover", q: 17, r: -5, s: -12 },
  { type: "empty", presentation: "hover", q: 17, r: -4, s: -13 },
  { type: "empty", presentation: "hover", q: 17, r: -3, s: -14 },
  { type: "empty", presentation: "hover", q: 17, r: -2, s: -15 },
  { type: "empty", presentation: "hover", q: 18, r: -15, s: -3 },
  { type: "empty", presentation: "hover", q: 18, r: -14, s: -4 },
  { type: "empty", presentation: "hover", q: 18, r: -13, s: -5 },
  { type: "empty", presentation: "hover", q: 18, r: -12, s: -6 },
  { type: "empty", presentation: "hover", q: 18, r: -11, s: -7 },
  { type: "empty", presentation: "hover", q: 18, r: -10, s: -8 },
  { type: "empty", presentation: "hover", q: 18, r: -9, s: -9 },
  { type: "empty", presentation: "hover", q: 18, r: -8, s: -10 },
  { type: "empty", presentation: "hover", q: 18, r: -7, s: -11 },
  { type: "empty", presentation: "hover", q: 18, r: -6, s: -12 },
  { type: "empty", presentation: "hover", q: 18, r: -5, s: -13 },
  { type: "empty", presentation: "hover", q: 18, r: -4, s: -14 },
  { type: "empty", presentation: "hover", q: 18, r: -3, s: -15 },
  { type: "empty", presentation: "hover", q: 19, r: -16, s: -3 },
  { type: "empty", presentation: "hover", q: 19, r: -15, s: -4 },
  { type: "empty", presentation: "hover", q: 19, r: -14, s: -5 },
  { type: "empty", presentation: "hover", q: 19, r: -13, s: -6 },
  { type: "empty", presentation: "hover", q: 19, r: -12, s: -7 },
  { type: "empty", presentation: "hover", q: 19, r: -11, s: -8 },
  { type: "empty", presentation: "hover", q: 19, r: -10, s: -9 },
  { type: "empty", presentation: "hover", q: 19, r: -9, s: -10 },
  { type: "empty", presentation: "hover", q: 19, r: -8, s: -11 },
  { type: "empty", presentation: "hover", q: 19, r: -7, s: -12 },
  { type: "empty", presentation: "hover", q: 19, r: -6, s: -13 },
  { type: "empty", presentation: "hover", q: 19, r: -5, s: -14 },
  { type: "empty", presentation: "hover", q: 19, r: -4, s: -15 },
  { type: "empty", presentation: "hover", q: 19, r: -3, s: -16 },
  { type: "empty", presentation: "hover", q: 20, r: -16, s: -4 },
  { type: "empty", presentation: "hover", q: 20, r: -15, s: -5 },
  { type: "empty", presentation: "hover", q: 20, r: -14, s: -6 },
  { type: "empty", presentation: "hover", q: 20, r: -13, s: -7 },
  { type: "empty", presentation: "hover", q: 20, r: -12, s: -8 },
  { type: "empty", presentation: "hover", q: 20, r: -11, s: -9 },
  { type: "empty", presentation: "hover", q: 20, r: -10, s: -10 },
  { type: "empty", presentation: "hover", q: 20, r: -9, s: -11 },
  { type: "empty", presentation: "hover", q: 20, r: -8, s: -12 },
  { type: "empty", presentation: "hover", q: 20, r: -7, s: -13 },
  { type: "empty", presentation: "hover", q: 20, r: -6, s: -14 },
  { type: "empty", presentation: "hover", q: 20, r: -5, s: -15 },
  { type: "empty", presentation: "hover", q: 20, r: -4, s: -16 },
  { type: "u", id: "u1", status: "PASS", q: 1, r: -1, s: 0 },
  { type: "u", id: "u2", status: "TODO", q: 2, r: -2, s: 0 },
  { type: "u", id: "u-ellipsis", status: null, q: 3, r: -3, s: 0 },
  { type: "u", id: "u5", status: "FAIL", q: 4, r: -4, s: 0 },
  { type: "u", id: "u6", status: "PASS", q: 5, r: -5, s: 0 },
  { type: "v", id: "VISION-002", name: "重启 backstage.js 项目", status: "TODO", q: 0, r: 1, s: -1 },
  { type: "v", id: "VISION-003", name: "优化 Gitlab 的读取", status: "TODO", isOrigin: true, q: 0, r: 0, s: 0 },
  { type: "v", id: "v-ellipsis", status: null, q: 0, r: -1, s: 1 },
  { type: "v", id: "VISION-001", name: "重启 backstage.js 项目，优化 Gitlab 的读取", status: "TODO", q: 0, r: -2, s: 2 },
  { type: "w", id: "w1", status: "TODO", q: 1, r: 0, s: -1 },
  { type: "w", id: "w2", status: "PASS", q: 2, r: 0, s: -2 },
  { type: "w", id: "w3", status: "FAIL", q: 3, r: 0, s: -3 },
  { type: "w", id: "w-ellipsis", status: null, q: 4, r: 0, s: -4 },
  { type: "w", id: "w7", status: "HOLD", q: 5, r: 0, s: -5 },
  { type: "w", id: "w8", status: "TODO", q: 6, r: 0, s: -6 },
  { type: "w", id: "w9", status: "PASS", q: 7, r: 0, s: -7 },
  { type: "w", id: "w-ellipsis-2", status: null, q: 8, r: 0, s: -8 },
  { type: "w", id: "w13", status: "HOLD", q: 9, r: 0, s: -9 },
  { type: "w", id: "w14", status: "PASS", q: 10, r: 0, s: -10 },
  { type: "w", id: "w15", status: "TODO", q: 11, r: 0, s: -11 },
  { type: "w", id: "w16", status: "FAIL", q: 12, r: 0, s: -12 },
  { type: "w", id: "w17", status: "PASS", q: 13, r: 0, s: -13 },
];
