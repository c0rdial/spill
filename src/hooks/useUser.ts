import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import type { User } from "../lib/types";

export function useUser(authUserId: string | undefined) {
  return useQuery({
    queryKey: ["user", authUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUserId!)
        .maybeSingle();
      if (error) throw error;
      return data as User | null;
    },
    enabled: !!authUserId,
    staleTime: 5 * 60 * 1000,
  });
}
