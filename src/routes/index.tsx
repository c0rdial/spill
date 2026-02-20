import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: function Index() {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold">spill</h1>
      </div>
    );
  },
});
