import { Link } from "@tanstack/react-router";
import type { MatchWithUser } from "../hooks/useMatches";

type Props = {
  match: MatchWithUser;
};

function relativeTime(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function MatchCard({ match }: Props) {
  const { other_user } = match;

  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="flex items-center gap-4 p-4 bg-spill-card rounded-xl border border-spill-border"
    >
      <div className="w-12 h-12 rounded-full bg-spill-border overflow-hidden flex-shrink-0 flex items-center justify-center">
        {other_user.photo_url ? (
          <img
            src={other_user.photo_url}
            alt={other_user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-spill-text font-semibold text-lg">
            {other_user.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-spill-text font-semibold truncate">
          {other_user.name}
        </p>
        <p className="text-spill-muted text-sm">
          {relativeTime(match.created_at)}
        </p>
      </div>
    </Link>
  );
}
