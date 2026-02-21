import { createRoute } from "@tanstack/react-router";
import { protectedLayout } from "./_protected";

export const spillRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/spill",
  component: () => (
    <div className="flex items-center justify-center min-h-[80vh] px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Today's Spill</h1>
        <p className="text-spill-muted">Coming soon.</p>
      </div>
    </div>
  ),
});
