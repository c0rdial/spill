import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader)
    return json({ error: "Missing auth" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user)
    return json({ error: "Invalid token" }, 401);

  const { prompt_id } = await req.json();
  if (!prompt_id)
    return json({ error: "Missing prompt_id" }, 400);

  const { data: caller, error: callerErr } = await admin
    .from("users")
    .select("gender, show_me, interests")
    .eq("id", user.id)
    .single();
  if (callerErr || !caller)
    return json({ error: "User profile not found" }, 404);

  // Find answers for this prompt (not by caller)
  const { data: candidates } = await admin
    .from("answers")
    .select("user_id")
    .eq("prompt_id", prompt_id)
    .neq("user_id", user.id);

  if (candidates && candidates.length > 0) {
    const candidateIds = candidates.map((c) => c.user_id);

    // Fetch all needed data in parallel
    const [profilesRes, revealsRes, matchesRes] = await Promise.all([
      admin
        .from("users")
        .select("id, gender, show_me, interests")
        .in("id", candidateIds),
      admin
        .from("reveals")
        .select("answerer_id")
        .eq("viewer_id", user.id),
      admin
        .from("matches")
        .select("user_a_id, user_b_id")
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`),
    ]);

    const revealedSet = new Set(
      (revealsRes.data ?? []).map((r) => r.answerer_id),
    );
    const matchedSet = new Set(
      (matchesRes.data ?? []).flatMap((m) =>
        m.user_a_id === user.id ? [m.user_b_id] : [m.user_a_id],
      ),
    );
    const profileMap = new Map(
      (profilesRes.data ?? []).map((p) => [p.id, p]),
    );

    const callerShowMe = caller.show_me as string[];
    const callerGender = caller.gender as string;
    const callerInterests = caller.interests as string[];

    // Filter: no existing reveal, no match, bidirectional gender compatibility
    const eligible = candidateIds.filter((id) => {
      if (revealedSet.has(id) || matchedSet.has(id)) return false;
      const p = profileMap.get(id);
      if (!p) return false;
      return (
        callerShowMe.includes(p.gender) &&
        (p.show_me as string[]).includes(callerGender)
      );
    });

    // Score by interest overlap + randomness, take top 5
    const scored = eligible.map((id) => {
      const p = profileMap.get(id)!;
      const overlap = (p.interests as string[]).filter((i: string) =>
        callerInterests.includes(i),
      ).length;
      return { id, score: overlap * 0.5 + Math.random() };
    });
    scored.sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 5);
    if (top.length > 0) {
      await admin.from("reveals").upsert(
        top.map((t) => ({
          viewer_id: user.id,
          answerer_id: t.id,
          prompt_id,
        })),
        { onConflict: "viewer_id,answerer_id,prompt_id", ignoreDuplicates: true },
      );
    }

    // --- Reverse reveals: give earlier answerers a card for the caller ---
    const { data: reverseExisting } = await admin
      .from("reveals")
      .select("viewer_id")
      .eq("answerer_id", user.id)
      .eq("prompt_id", prompt_id);

    const alreadyHasReversSet = new Set(
      (reverseExisting ?? []).map((r) => r.viewer_id),
    );

    const reverseEligible = candidateIds.filter((id) => {
      if (alreadyHasReversSet.has(id) || matchedSet.has(id)) return false;
      const p = profileMap.get(id);
      if (!p) return false;
      return (
        (p.show_me as string[]).includes(callerGender) &&
        callerShowMe.includes(p.gender)
      );
    });

    if (reverseEligible.length > 0) {
      // Count pending reveals per eligible user for this prompt
      const { data: pendingCounts } = await admin
        .from("reveals")
        .select("viewer_id")
        .eq("prompt_id", prompt_id)
        .eq("action", "pending")
        .in("viewer_id", reverseEligible);

      const countMap = new Map<string, number>();
      for (const r of pendingCounts ?? []) {
        countMap.set(r.viewer_id, (countMap.get(r.viewer_id) ?? 0) + 1);
      }

      const reverseRows = reverseEligible
        .filter((id) => (countMap.get(id) ?? 0) < 5)
        .map((id) => ({
          viewer_id: id,
          answerer_id: user.id,
          prompt_id,
        }));

      if (reverseRows.length > 0) {
        await admin.from("reveals").upsert(reverseRows, {
          onConflict: "viewer_id,answerer_id,prompt_id",
          ignoreDuplicates: true,
        });
      }
    }
  }

  // Return ALL pending reveals for this user+prompt
  const { data: pending, error: fetchErr } = await admin
    .from("reveals")
    .select("id, answerer_id")
    .eq("viewer_id", user.id)
    .eq("prompt_id", prompt_id)
    .eq("action", "pending");

  if (fetchErr)
    return json({ error: fetchErr.message }, 500);

  if (!pending || pending.length === 0)
    return json({ reveals: [] });

  // Get answer text for each reveal
  const { data: answers } = await admin
    .from("answers")
    .select("user_id, text")
    .eq("prompt_id", prompt_id)
    .in("user_id", pending.map((r) => r.answerer_id));

  const answerMap = new Map(
    (answers ?? []).map((a) => [a.user_id, a.text]),
  );

  const reveals = pending.map((r) => ({
    out_reveal_id: r.id,
    out_answer_text: answerMap.get(r.answerer_id) ?? "",
    out_answerer_id: r.answerer_id,
  }));

  return json({ reveals });
});
