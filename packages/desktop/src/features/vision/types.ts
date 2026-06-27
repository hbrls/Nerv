/**
 * Vision 元信息（Origin 节点的语义）。
 *
 * 当用户提出一个 Vision 时，用它初始化为 Origin。
 * - `id`：真实字段，Vision 唯一标识，如 `"VISION-001"`。
 * - `name`：真实字段，Vision 的一句话描述。
 * - `title`：计算字段，= `${id}: ${name}`，用于展示，不存储。
 */
export interface VisionMeta {
  id: string;
  name: string;
}

export function visionTitle(meta: Pick<VisionMeta, "id" | "name">): string {
  return `${meta.id}: ${meta.name}`;
}

export type VisionStatus = "FAIL" | "HOLD" | "PASS" | "TODO";

/**
 * 单轴节点的原始数据。
 *
 * `status` 三态语义：
 * - `undefined`：未设置（如 origin，或调用方未提供）。
 * - `null`：显式标记该节点为「不确定性占位节点」（`...`），代表轴上存在一段
 *   身份未知 / 待澄清的内容。渲染层据此以白色背景 + 文本 `...` 呈现。
 * - `VisionStatus`：正常的确定性节点状态。
 *
 * `...` 节点约束（由后端数据库控制，前端不校验）：
 * - 每条轴至多一个 `...` 节点；
 * - 可出现在轴的任意位置（开头 / 中间 / 末尾）；
 * - 不代表连续区间的省略，而是一个独立的不确定性占位。
 */
export interface VisionNodeData {
  id: string;
  name?: string;
  status?: VisionStatus | null;
}

export interface HexPoint {
  q: number;
  r: number;
  s: number;
}

export type Axis = "u" | "v" | "w";

export interface Vision {
  /**
   * 原点 Vision 的 id，指向 v 轴数组中某个元素的 id。
   * 该元素即原点（坐标 0,0,0），u/w 轴挂在原点上。
   */
  a: string;
  u: VisionNodeData[];
  v: VisionNodeData[];
  w: VisionNodeData[];
}

/**
 * 轴上节点渲染后的几何点。`status` 透传自 `VisionNodeData`：
 * - `null`：`...` 不确定性占位节点，占用一个 index，沿用 `step = index + 1`
 *   的连续坐标规则；其「不连续」是语义层（真实身份跳号）而非坐标层。
 *   渲染为白色背景 + 文本 `...`（与 origin 同色）。
 * - `undefined`：未设置（如 origin）。
 * - `VisionStatus`：正常节点状态。
 */
export interface VisionPoint {
  id: string;
  name?: string;
  status?: VisionStatus | null;
  /**
   * 所属轴（天然 type）。origin 节点不带 axis。
   * 渲染层据此分发到对应 Node 的 render function（如 w → WorkshopNode）。
   */
  axis?: Axis;
  q: number;
  r: number;
  s: number;
}
