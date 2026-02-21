import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Prompt } from "../lib/types";

export function useTodayPrompt() {
  return useQuery({
    queryKey: ["todayPrompt"],
    queryFn: async () => {
      const formatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Kuala_Lumpur",
      });
      const today = formatter.format(new Date());
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("active_date", today)
        .maybeSingle();
      if (error) throw error;
      return data as Prompt | null;
    },
  });
}
