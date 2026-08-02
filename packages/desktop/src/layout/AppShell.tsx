import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  return (
    <div className="drawer h-screen lg:drawer-open">
      <input id="app-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content relative flex min-h-0 flex-col bg-base-200">
        <label
          htmlFor="app-drawer"
          className="btn btn-square btn-sm absolute left-4 top-4 z-30 border-base-300 bg-base-100 lg:hidden"
          aria-label="Open menu"
          title="Open menu"
        >
          <span className="flex w-4 flex-col gap-1">
            <span className="h-0.5 rounded bg-current" />
            <span className="h-0.5 rounded bg-current" />
            <span className="h-0.5 rounded bg-current" />
          </span>
        </label>
        <main className="app-scrollbar min-h-0 flex-1 overflow-y-auto p-4 pt-16 lg:pt-4">
          <Outlet />
        </main>
      </div>
      <div className="drawer-side z-40">
        <label htmlFor="app-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <Sidebar />
      </div>
    </div>
  );
}
