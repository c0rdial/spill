import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { Prompt } from "../lib/types";

export function useTodayPrompt() {
  return useQuery({
    queryKey: ["todayPrompt"],
    queryFn: async () => {
      const today = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" })
      )
        .toISOString()
        .split("T")[0];
      const { data, error } = await supabase
        .from("prompts")
        .select("*")
        .eq("active_date", today)
        .single();
      if (error) throw error;
      return data as Prompt;
    },
  });
}
