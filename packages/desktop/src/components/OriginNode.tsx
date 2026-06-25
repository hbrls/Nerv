import { useState } from "react";
import type { ReactNode } from "react";
import { Hex, Hexagon, Text } from "react-hexgrid";
import { FONT_SIZE, HOVER_FILL, STROKE_WIDTH } from "./constants";

const NODE_STYLE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH / 2,
} as const;

const ORIGIN_TEXT = "A";

export interface OriginNodeProps {
  q: number;
  r: number;
  s: number;
  onSelect?: (id: string) => void;
  children?: ReactNode;
}

/**
 * OriginNode —— Vision 坐标系的根节点。
 *
 * 天然是原点，无 type / id 判别，无 status 与配色概念。
 * 自持其视觉设计：六边形边框宽度为常规 1/2（0.2），Text 固定 "A"。
 * hover 时白底（HOVER_FILL），与其余节点交互一致。
 */
export function OriginNode({ q, r, s, onSelect, children }: OriginNodeProps) {
  const [hovered, setHovered] = useState(false);
  const hex = new Hex(q, r, s);
  const fill = hovered ? HOVER_FILL : NODE_STYLE.fill;
  const cellStyle = { ...NODE_STYLE, fill };
  return (
    <Hexagon
      q={hex.q}
      r={hex.r}
      s={hex.s}
      cellStyle={cellStyle}
      style={{ cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        if (onSelect) {
          onSelect(ORIGIN_TEXT);
        }
      }}
    >
      <Text fontSize={FONT_SIZE}>{ORIGIN_TEXT}</Text>
      {children}
    </Hexagon>
  );
}
