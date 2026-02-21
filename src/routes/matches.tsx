import { createRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
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

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("spill_matches_seen_at", new Date().toISOString());
    }
  }, [isLoading]);

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-3xl font-bold text-spill-text">Matches</h1>
      </div>
      <div className="px-6 space-y-3">
        {isLoading ? (
          <p className="text-spill-muted">Loading...</p>
        ) : matches && matches.length > 0 ? (
          matches.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.5), ease: [0.16, 1, 0.3, 1] }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center text-center py-20">
            <div className="w-14 h-14 rounded-full bg-spill-card border border-spill-border flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-spill-muted">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </div>
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
