import { createRoute } from "@tanstack/react-router";
import { protectedLayout } from "./_protected";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useMatches } from "../hooks/useMatches";
import { MatchCard } from "../components/MatchCard";

export const matchesRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/matches",
  component: MatchesPage,
});

function MatchesPage() {
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: matches, isLoading } = useMatches(user?.id);

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-spill-text">Matches</h1>
      </div>
      <div className="px-6 space-y-3">
        {isLoading ? (
          <p className="text-spill-muted">Loading...</p>
        ) : matches && matches.length > 0 ? (
          matches.map((m) => <MatchCard key={m.id} match={m} />)
        ) : (
          <div className="text-center py-20">
            <p className="text-spill-text text-xl font-bold mb-2">
              No matches yet
            </p>
            <p className="text-spill-muted">
              Answer today's spill and dare someone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
