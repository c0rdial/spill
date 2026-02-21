import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
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
}
