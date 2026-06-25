/**
 * Vision 节点共享的视觉常量。
 *
 * 各 Node render function 冗余持有自身特有设计，但 strokeWidth / fontSize
 * 这类全局规范值统一从此处引用，避免多处散落不同数值。
 */
export const STROKE_WIDTH = 0.4;

export const FONT_SIZE = 2;

export const HOVER_FILL = "#ffffff";
