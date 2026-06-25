import { useState } from "react";
import { HexGrid, Layout } from "react-hexgrid";
import { OriginNode } from "../components/OriginNode";
import { UpNode } from "../components/UpNode";
import { VisionNode } from "../components/VisionNode";
import { WorkshopNode } from "../components/WorkshopNode";
import { A } from "../data/vision";
import { VisionBuilder } from "../features/vision/VisionBuilder";

export function Nerv() {
  const nodes = VisionBuilder(A);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
        <HexGrid width={1200} height={600} viewBox="-30 -50 200 100" style={{ backgroundColor: "#fff" }}>
          <Layout size={{ x: 4, y: 4 }} flat={true} spacing={1.15} origin={{ x: 0, y: 0 }}>
            {nodes.map((node) => {
              if (node.id === "origin") {
                return (
                  <OriginNode key={node.id} q={node.q} r={node.r} s={node.s} onSelect={setSelectedId} />
                );
              }
              if (node.axis === "w") {
                return (
                  <WorkshopNode
                    key={node.id}
                    id={node.id}
                    status={node.status}
                    q={node.q}
                    r={node.r}
                    s={node.s}
                    onSelect={setSelectedId}
                  />
                );
              }
              if (node.axis === "v") {
                return (
                  <VisionNode
                    key={node.id}
                    id={node.id}
                    status={node.status}
                    q={node.q}
                    r={node.r}
                    s={node.s}
                    onSelect={setSelectedId}
                  />
                );
              }
              if (node.axis === "u") {
                return (
                  <UpNode
                    key={node.id}
                    id={node.id}
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
                {selectedId ?? "Vision Node"}
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
