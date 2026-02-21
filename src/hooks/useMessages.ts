import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Message } from "../lib/types";

export function useMessages(matchId: string) {
  const queryClient = useQueryClient();
  const [realtimeReady, setRealtimeReady] = useState(false);

  const query = useQuery({
    queryKey: ["messages", matchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(
            ["messages", matchId],
            (old) => [...(old ?? []), payload.new as Message],
          );
        },
      )
      .subscribe(() => setRealtimeReady(true));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, queryClient]);

  return { ...query, realtimeReady };
}
