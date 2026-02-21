import { Link, useMatchRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useMatches } from "../hooks/useMatches";

const tabs = [
  {
    to: "/spill" as const,
    label: "Spill",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C12 2 7 7.5 7 12a5 5 0 0 0 10 0c0-4.5-5-10-5-10z" />
      </svg>
    ),
  },
  {
    to: "/matches" as const,
    label: "Matches",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    to: "/profile" as const,
    label: "Profile",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </svg>
    ),
  },
];

const MATCHES_SEEN_KEY = "spill_matches_seen_at";

export function BottomNav() {
  const matchRoute = useMatchRoute();
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: matches } = useMatches(user?.id);

  const newMatchCount = (() => {
    if (!matches?.length) return 0;
    const lastSeen = localStorage.getItem(MATCHES_SEEN_KEY);
    if (!lastSeen) return matches.length;
    return matches.filter((m) => m.created_at > lastSeen).length;
  })();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-spill-card/95 backdrop-blur-sm border-t border-spill-border">
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map((tab) => {
          const isActive = matchRoute({ to: tab.to, fuzzy: true });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`relative flex-1 flex flex-col items-center gap-1 pt-3 pb-2 transition-colors ${
                isActive ? "text-spill-red" : "text-spill-muted"
              }`}
            >
              <span className="relative">
                {tab.icon}
                {tab.to === "/matches" && newMatchCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 bg-spill-green text-spill-bg text-[9px] font-bold min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                    {newMatchCount}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest">
                {tab.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="nav-indicator"
                  className="absolute bottom-1 w-6 h-[2px] bg-spill-red rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
