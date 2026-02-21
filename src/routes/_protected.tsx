import { createRoute, Outlet } from "@tanstack/react-router";
import { rootRoute } from "./__root";
import { AuthGuard } from "../components/AuthGuard";
import { BottomNav } from "../components/BottomNav";

export const protectedLayout = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  component: () => (
    <AuthGuard>
      <div className="pb-14">
        <Outlet />
      </div>
      <BottomNav />
    </AuthGuard>
  ),
});
