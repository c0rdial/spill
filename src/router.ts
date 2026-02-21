import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./routes/__root";
import { indexRoute } from "./routes/index";
import { loginRoute } from "./routes/login";
import { onboardingRoute } from "./routes/onboarding";
import { protectedLayout } from "./routes/_protected";
import { spillRoute } from "./routes/spill";
import { matchesRoute } from "./routes/matches";
import { profileRoute } from "./routes/profile";

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  onboardingRoute,
  protectedLayout.addChildren([spillRoute, matchesRoute, profileRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
