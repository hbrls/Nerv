import { Hex, Hexagon } from "react-hexgrid";
import type { HexPoint } from "../features/vision/types";

export interface EmptyNodeProps extends HexPoint {
  /** 离线计算出的默认可见性；hover 只临时覆盖该值。 */
  visible: boolean;
}

/**
 * EmptyNode —— 画布空位置的统一渲染。
 *
 * `visible=true` 始终显示；`visible=false` 默认隐藏，仅在 hover 时显示。
 * 具体的 hover 过渡由 CSS 处理，数据对象不会被交互状态修改。
 */
export function EmptyNode({ q, r, s, visible }: EmptyNodeProps) {
  const className = [
    "nerv-grid-cell-empty",
    visible ? "nerv-grid-cell-empty--visible" : "nerv-grid-cell-empty--hover",
  ].join(" ");
  const hex = new Hex(q, r, s);

  return (
    <Hexagon
      q={hex.q}
      r={hex.r}
      s={hex.s}
      className={className}
      aria-hidden="true"
    />
  );
}
