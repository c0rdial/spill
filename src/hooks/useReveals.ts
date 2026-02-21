import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export type RevealResult = {
  out_reveal_id: string;
  out_answer_text: string;
  out_answerer_id: string;
};

export function useReveals(
  userId: string | undefined,
  promptId: string | undefined,
) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reveals", userId, promptId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("reveals", {
        body: { prompt_id: promptId },
      });
      if (error) throw error;
      return (data?.reveals ?? []) as RevealResult[];
    },
    enabled: !!userId && !!promptId,
  });

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`reveals:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reveals",
          filter: `viewer_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["reveals", userId, promptId],
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, promptId, queryClient]);

  return query;
}
