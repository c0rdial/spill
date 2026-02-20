import { createRootRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Outlet />
    </div>
  ),
});
