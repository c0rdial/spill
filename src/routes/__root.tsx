import { createRootRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-spill-bg text-spill-text font-body">
      <div className="max-w-[430px] mx-auto relative">
        <Outlet />
      </div>
    </div>
  ),
});
