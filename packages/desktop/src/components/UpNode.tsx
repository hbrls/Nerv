import { useState } from "react";
import type { ReactNode } from "react";
import { Hex, Hexagon, Text } from "react-hexgrid";
import type { VisionStatus } from "../features/vision/types";
import { FONT_SIZE, HOVER_FILL, STROKE_WIDTH } from "./constants";

const NODE_STYLE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
} as const;

const STATUS_FILL: Record<VisionStatus, string> = {
  FAIL: "#e11d21",
  HOLD: "#fef2c0",
  PASS: "#009800",
  TODO: "#fbca04",
};

const UNCERTAIN_TEXT = "•••";

export interface UpNodeProps {
  q: number;
  r: number;
  s: number;
  id?: string;
  status?: VisionStatus | null;
  label?: string;
  children?: ReactNode;
  onSelect?: (id: string) => void;
}

/**
 * UpNode —— u 轴节点的 render function。
 *
 * 天然属于 u 轴（由 VisionPoint.axis === "u" 分发），无需 type 字段。
 * 持有 u 轴自身的视觉设计：
 * - `status: null`（uncertain，`•••`）是它的一个状态：无边框、无背景，
 *   仅渲染 `•••`；hover 时白底、无边框。
 * - `status: VisionStatus`：按 STATUS_FILL 配色。
 * - `status: undefined`：透明底、常规边框。
 */
export function UpNode({ q, r, s, id, status, label, children, onSelect }: UpNodeProps) {
  const [hovered, setHovered] = useState(false);
  const hex = new Hex(q, r, s);
  const isUncertain = status === null;
  const text = label ?? (isUncertain ? UNCERTAIN_TEXT : id ?? `${hex.q},${hex.r},${hex.s}`);
  const baseFill = isUncertain ? "none" : status ? STATUS_FILL[status] : "none";
  const baseStroke = isUncertain ? "none" : NODE_STYLE.stroke;
  const fill = hovered ? HOVER_FILL : baseFill;
  const stroke = isUncertain ? "none" : baseStroke;
  const cellStyle = { ...NODE_STYLE, fill, stroke };
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
        if (id && onSelect) {
          onSelect(id);
        }
      }}
    >
      <Text fontSize={FONT_SIZE}>{text}</Text>
      {children}
    </Hexagon>
  );
}
