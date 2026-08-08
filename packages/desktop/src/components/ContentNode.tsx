import { useState } from "react";
import type { ReactNode } from "react";
import { Hex, Hexagon, Text } from "react-hexgrid";
import type { Axis, BusinessStatus } from "../features/vision/types";
import { visionTitle } from "../features/vision/types";
import { FONT_SIZE, HOVER_FILL, STROKE_WIDTH } from "./constants";

const NODE_STYLE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: STROKE_WIDTH,
} as const;

type ColoredBusinessStatus = Exclude<BusinessStatus, "UNKNOWN">;

const STATUS_FILL: Record<ColoredBusinessStatus, string> = {
  FAIL: "#e11d21",
  HOLD: "#fef2c0",
  PASS: "#009800",
  TODO: "#fbca04",
};

const UNKNOWN_TEXT = "•••";

export interface ContentNodeProps {
  axis: Axis;
  q: number;
  r: number;
  s: number;
  id?: string;
  name?: string;
  status?: BusinessStatus;
  isOrigin?: boolean;
  label?: string;
  children?: ReactNode;
  onSelect?: (id: string) => void;
}

/**
 * ContentNode —— u/v/w 三条业务轴共用的渲染基座。
 *
 * 轴只决定文字方向，业务状态统一由 BusinessStatus 处理。
 * `UNKNOWN` 是 BusinessStatus 的一种状态，显示为 `•••`，不参与普通配色。
 */
export function ContentNode({
  axis,
  q,
  r,
  s,
  id,
  name,
  status,
  isOrigin,
  label,
  children,
  onSelect,
}: ContentNodeProps) {
  const [hovered, setHovered] = useState(false);
  const hex = new Hex(q, r, s);
  const isUnknown = status === "UNKNOWN";
  const isOriginNode = axis === "v" && isOrigin === true;
  const text = label ?? (
    isUnknown
      ? UNKNOWN_TEXT
      : name && id
        ? visionTitle({ id, name })
        : id ?? `${hex.q},${hex.r},${hex.s}`
  );
  const textAnchor = isUnknown ? "middle" : axis === "v" ? "end" : "start";
  const statusFill = status && status !== "UNKNOWN" ? STATUS_FILL[status] : "none";
  const baseFill = isOriginNode || isUnknown ? "none" : statusFill;
  const baseStroke = isOriginNode ? NODE_STYLE.stroke : isUnknown ? "none" : NODE_STYLE.stroke;
  const stroke = isOriginNode ? baseStroke : isUnknown ? "none" : baseStroke;
  const fill = hovered ? HOVER_FILL : baseFill;
  const cellStyle = {
    ...NODE_STYLE,
    fill,
    stroke,
    strokeWidth: STROKE_WIDTH,
  };

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
      <Text textAnchor={textAnchor} fontSize={FONT_SIZE}>{text}</Text>
      {children}
    </Hexagon>
  );
}
