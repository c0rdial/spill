import { Link, useMatchRoute } from "@tanstack/react-router";

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

export function BottomNav() {
  const matchRoute = useMatchRoute();

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
              {tab.icon}
              <span className="text-[10px] font-medium uppercase tracking-widest">
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-[2px] bg-spill-red rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
