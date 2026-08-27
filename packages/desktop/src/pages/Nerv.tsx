import { useState } from "react";
import { HexGrid, Layout } from "react-hexgrid";
import { useParams } from "react-router-dom";
import { EmptyNode } from "../components/EmptyNode";
import { UpNode } from "../components/UpNode";
import { VisionNode } from "../components/VisionNode";
import { WorkNode } from "../components/WorkNode";
import { b as innovation } from "../data/nerv-innovation";
import { b as nerv1 } from "../data/nerv-1";
import { b as nerv2 } from "../data/nerv-2";
import { b as nerv3 } from "../data/nerv-3";
import type { ContentCanvasNode, CanvasNode } from "../features/vision/types";
import { visionTitle } from "../features/vision/types";
import { NotFound } from "./NotFound";

const NERV_DATASETS: Record<string, CanvasNode[]> = {
  "nerv-1": nerv1,
  "nerv-2": nerv2,
  "nerv-3": nerv3,
  innovation,
};

export function Nerv() {
  const { nervId } = useParams();
  const nodes = nervId ? NERV_DATASETS[nervId] : undefined;

  if (!nodes) {
    return <NotFound />;
  }

  return <NervCanvas key={nervId} nodes={nodes} />;
}

interface NervCanvasProps {
  nodes: CanvasNode[];
}

function NervCanvas({ nodes }: NervCanvasProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const originPoint = nodes.find(
    (node): node is ContentCanvasNode => node.type === "v" && node.isOrigin === true,
  );
  const originId = originPoint?.id;
  const originTitle = originPoint
    ? visionTitle({ id: originPoint.id, name: originPoint.name ?? "" })
    : "Vision Node";

  return (
    <div className="drawer drawer-end">
      <input
        id="nerv-detail-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={selectedId !== null}
        onChange={(event) => {
          if (!event.currentTarget.checked) {
            setSelectedId(null);
          }
        }}
      />
      <div className="drawer-content">
        <HexGrid width={1200} height={750} viewBox="-60 -50 200 100" style={{ backgroundColor: "#fff" }}>
          <Layout size={{ x: 5, y: 5 }} flat={true} spacing={1.2} origin={{ x: 0, y: 0 }}>
            {nodes.map((node) => {
              if (node.type === "empty") {
                return (
                  <EmptyNode
                    key={`empty:${node.q},${node.r},${node.s}`}
                    q={node.q}
                    r={node.r}
                    s={node.s}
                    visible={node.visible}
                  />
                );
              }
              if (node.type === "w") {
                return (
                  <WorkNode
                    key={node.id}
                    id={node.id}
                    name={node.name}
                    status={node.status}
                    q={node.q}
                    r={node.r}
                    s={node.s}
                    onSelect={setSelectedId}
                  />
                );
              }
              if (node.type === "v") {
                return (
                  <VisionNode
                    key={node.id}
                    id={node.id}
                    name={node.name}
                    status={node.status}
                    isOrigin={node.isOrigin}
                    q={node.q}
                    r={node.r}
                    s={node.s}
                    onSelect={setSelectedId}
                  />
                );
              }
              if (node.type === "u") {
                return (
                  <UpNode
                    key={node.id}
                    id={node.id}
                    name={node.name}
                    status={node.status}
                    q={node.q}
                    r={node.r}
                    s={node.s}
                    onSelect={setSelectedId}
                  />
                );
              }
              return null;
            })}
          </Layout>
        </HexGrid>
      </div>
      <div className="drawer-side z-30 overflow-x-hidden">
        <label htmlFor="nerv-detail-drawer" aria-label="close detail" className="drawer-overlay" />
        <aside className="app-scrollbar flex h-full w-full flex-col overflow-y-auto border-l border-base-300 bg-base-100 sm:w-[70vw] sm:max-w-[70vw]">
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-base-300 px-4 py-2">
            <h2 className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold leading-5">
                {selectedId === originId ? originTitle : (selectedId ?? "Vision Node")}
              </span>
            </h2>
            <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={() => setSelectedId(null)}>
              Close
            </button>
          </div>
          <div className="p-4">
            <pre className="app-scrollbar whitespace-pre-wrap break-words rounded bg-base-200 p-3 text-xs leading-5">
              {selectedId ?? ""}
            </pre>
          </div>
        </aside>
      </div>
    </div>
  );
}
