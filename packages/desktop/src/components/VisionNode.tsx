import { useState } from "react";
import type { ReactNode } from "react";
import { Hex, Hexagon, Text } from "react-hexgrid";
import type { VisionStatus } from "../features/vision/types";
import { visionTitle } from "../features/vision/types";
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

export interface VisionNodeProps {
  q: number;
  r: number;
  s: number;
  id?: string;
  name?: string;
  status?: VisionStatus | null;
  isOrigin?: boolean;
  label?: string;
  children?: ReactNode;
  onSelect?: (id: string) => void;
}

/**
 * VisionNode —— v 轴节点的 render function。
 *
 * 天然属于 v 轴（由 VisionPoint.axis === "v" 分发），无需 type 字段。
 * 持有 v 轴自身的视觉设计：
 * - `isOrigin`：原点样式，严格复刻旧 OriginNode——无配色（fill=none）、
 *   边框宽度减半（STROKE_WIDTH/2），忽略 status。hover 时白底。
 * - `status: null`（uncertain，`•••`）：无边框、无背景，仅渲染 `•••`；hover 时白底、无边框。
 * - `status: VisionStatus`：按 STATUS_FILL 配色。
 */
export function VisionNode({ q, r, s, id, name, status, label, isOrigin, children, onSelect }: VisionNodeProps) {
  const [hovered, setHovered] = useState(false);
  const hex = new Hex(q, r, s);
  const isUncertain = status === null;
  const text = label ?? (isUncertain ? UNCERTAIN_TEXT : name && id ? visionTitle({ id, name }) : id ?? `${hex.q},${hex.r},${hex.s}`);
  const baseFill = isOrigin ? "none" : isUncertain ? "none" : status ? STATUS_FILL[status] : "none";
  const baseStroke = isOrigin ? NODE_STYLE.stroke : isUncertain ? "none" : NODE_STYLE.stroke;
  const baseStrokeWidth = isOrigin ? STROKE_WIDTH / 2 : STROKE_WIDTH;
  const fill = hovered ? HOVER_FILL : baseFill;
  const stroke = isOrigin ? baseStroke : isUncertain ? "none" : baseStroke;
  const cellStyle = { fill, stroke, strokeWidth: baseStrokeWidth };
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
      <Text textAnchor={isUncertain ? "middle" : "end"} fontSize={FONT_SIZE}>{text}</Text>
      {children}
    </Hexagon>
  );
}
