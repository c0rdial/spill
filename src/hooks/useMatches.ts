import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Match, User } from "../lib/types";

export type MatchWithUser = Match & { other_user: User };

export function useMatches(userId: string | undefined) {
  return useQuery({
    queryKey: ["matches", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("*, user_a:users!user_a_id(*), user_b:users!user_b_id(*)")
        .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => {
        const otherUser = m.user_a.id === userId ? m.user_b : m.user_a;
        return { ...m, other_user: otherUser } as MatchWithUser;
      });
    },
    enabled: !!userId,
  });
}
