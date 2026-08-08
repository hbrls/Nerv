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

export type BusinessStatus = "FAIL" | "HOLD" | "PASS" | "TODO" | "UNKNOWN";

/**
 * 单轴节点的原始数据。
 *
 * `status` 语义：
 * - `undefined`：未设置（如 origin，或调用方未提供）。
 * - `UNKNOWN`：显式标记该节点为「不确定性占位节点」（`...`），代表轴上存在一段
 *   身份未知 / 待澄清的内容。渲染层据此以无边框节点 + 文本 `...` 呈现。
 * - 其他 `BusinessStatus`：正常的确定性节点状态。
 *
 * `...` 节点语义：
 * - 可出现在轴的任意位置（开头 / 中间 / 末尾）；
 * - 不代表连续区间的省略，而是一个独立的不确定性占位。
 */
export interface ContentNodeData {
  id: string;
  name?: string;
  status?: BusinessStatus;
}

export interface HexPoint {
  q: number;
  r: number;
  s: number;
}

export type Axis = "u" | "v" | "w";

/**
 * 锚定在某个既有 ContentNode 上的局部轴。
 *
 * 节点按数组顺序从锚点沿对应方向正向排列；锚点本身仍属于父轴，
 * 不在子轴中重复定义。子轴上的节点也可以继续作为其他子轴的锚点。
 */
export interface AnchoredAxis {
  anchorId: string;
  u?: ContentNodeData[];
  v?: ContentNodeData[];
  w?: ContentNodeData[];
}

export interface Vision {
  /**
   * 原点 Vision 的 id，指向 v 轴数组中某个元素的 id。
   * 该元素即原点（坐标 0,0,0），u/w 轴挂在原点上。
   */
  a: string;
  u: ContentNodeData[];
  v: ContentNodeData[];
  w: ContentNodeData[];
  /** 按依赖关系解析的局部轴；允许锚定到主轴或先前子轴的节点。 */
  axes?: AnchoredAxis[];
}

/**
 * 轴上节点渲染后的几何点。`status` 透传自 `ContentNodeData`：
 * - `UNKNOWN`：`...` 不确定性占位节点，占用一个 index，沿用 `step = index + 1`
 *   的连续坐标规则；其「不连续」是语义层（真实身份跳号）而非坐标层。
 *   渲染为无边框节点 + 文本 `...`，hover 时显示白色背景。
 * - `undefined`：未设置（如 origin）。
 * - 其他 `BusinessStatus`：正常节点状态。
 */
export interface ContentPoint {
  id: string;
  name?: string;
  status?: BusinessStatus;
  /**
   * 所属轴（天然 type）。origin 节点属于 v 轴。
   * 渲染层据此分发到对应 Node 的 render function（如 w → WorkNode）。
   */
  axis?: Axis;
  q: number;
  r: number;
  s: number;
}

export interface EmptyCanvasNode extends HexPoint {
  type: "empty";
  /** 离线计算出的默认可见性；hover 只临时覆盖该值。 */
  visible: boolean;
}

export interface ContentCanvasNode extends ContentPoint {
  type: Axis;
  isOrigin?: boolean;
}

export type CanvasNode = ContentCanvasNode | EmptyCanvasNode;
