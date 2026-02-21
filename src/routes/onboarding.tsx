import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./__root";

export const onboardingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/onboarding",
  component: () => (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Onboarding</h1>
        <p className="text-spill-muted">Coming soon.</p>
      </div>
    </div>
  ),
});
