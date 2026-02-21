import { createRoute } from "@tanstack/react-router";
import { protectedLayout } from "./_protected";

export const matchesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/matches",
  component: () => (
    <div className="px-6 pt-12">
      <h1 className="text-3xl font-bold mb-4">Matches</h1>
      <p className="text-spill-muted">Coming soon.</p>
    </div>
  ),
});
