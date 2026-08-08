import type {
  Axis,
  CanvasNode,
  ContentCanvasNode,
  HexPoint,
  Vision,
} from "../features/vision/types";
import { VisionBuilder } from "../features/vision/VisionBuilder";

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
  size: 5,
  spacing: 1.2,
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

function buildVisionPoints(vision: Vision): ContentCanvasNode[] {
  return VisionBuilder(vision).map(({ axis, ...point }) => {
    if (!axis) {
      throw new Error(`Vision node axis missing: "${point.id}"`);
    }

    return {
      type: axis,
      ...point,
      ...(point.id === vision.a ? { isOrigin: true } : {}),
    };
  });
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

/** 离线生成静态 b，页面运行时不调用。 */
export function genRndB(
  vision: Vision,
  seed: number,
): CanvasNode[] {
  const nodes = buildVisionPoints(vision);
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

  const visibleKeys = new Set(
    selectedEmptyPoints
      .filter((point) => connectedKeys.has(pointKey(point)))
      .map(pointKey),
  );
  const emptyPoints = visibleGridPoints()
    .filter((point) => !nodeKeys.has(pointKey(point)))
    .map((point) => ({
      type: "empty" as const,
      visible: visibleKeys.has(pointKey(point)),
      ...point,
    }));

  return [...emptyPoints, ...nodes];
}
