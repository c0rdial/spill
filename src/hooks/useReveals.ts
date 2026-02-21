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
      const { data, error } = await supabase.rpc("get_reveals_for_user", {
        p_user_id: userId!,
        p_prompt_id: promptId!,
        p_limit: 5,
      });
      if (error) throw error;
      return (data ?? []) as RevealResult[];
    },
    enabled: !!userId && !!promptId,
  });
}
