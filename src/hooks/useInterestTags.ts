import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { InterestTag } from "../lib/types";

export function useInterestTags() {
  return useQuery({
    queryKey: ["interestTags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interest_tags")
        .select("*")
        .order("category")
        .order("label");
      if (error) throw error;
      return data as InterestTag[];
    },
  });
}
