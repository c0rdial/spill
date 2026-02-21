import { Link } from "@tanstack/react-router";
import type { MatchWithUser } from "../hooks/useMatches";

type Props = {
  match: MatchWithUser;
};

export function MatchCard({ match }: Props) {
  return (
    <Link
      to="/matches/$matchId"
      params={{ matchId: match.id }}
      className="flex items-center gap-4 p-4 bg-spill-card rounded-xl border border-spill-border"
    >
      <div className="w-12 h-12 rounded-full bg-spill-border overflow-hidden flex-shrink-0">
        {match.other_user.photo_url && (
          <img
            src={match.other_user.photo_url}
            alt={match.other_user.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-spill-text font-semibold truncate">
          {match.other_user.name}
        </p>
        <p className="text-spill-muted text-sm">Matched</p>
      </div>
    </Link>
  );
}
