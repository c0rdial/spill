import { Link, useMatchRoute } from "@tanstack/react-router";

const tabs = [
  { to: "/spill" as const, label: "Spill" },
  { to: "/matches" as const, label: "Matches" },
  { to: "/profile" as const, label: "Profile" },
];

export function BottomNav() {
  const matchRoute = useMatchRoute();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-spill-card border-t border-spill-border">
      <div className="max-w-[430px] mx-auto flex">
        {tabs.map((tab) => {
          const isActive = matchRoute({ to: tab.to, fuzzy: true });
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`flex-1 py-4 text-center text-sm font-semibold transition-colors ${
                isActive ? "text-spill-red" : "text-spill-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
