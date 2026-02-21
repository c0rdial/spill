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

  const { reveal_id, action } = await req.json();
  if (!reveal_id || !["dare", "pass"].includes(action))
    return json({ error: "Invalid params", matched: false });

  // Fetch reveal & verify ownership
  const { data: reveal, error: fetchErr } = await admin
    .from("reveals")
    .select("id, viewer_id, answerer_id, prompt_id, action")
    .eq("id", reveal_id)
    .single();
  if (fetchErr || !reveal)
    return json({ error: "Reveal not found", matched: false });
  if (reveal.viewer_id !== user.id)
    return json({ error: "Not your reveal", matched: false });
  if (reveal.action !== "pending")
    return json({ error: "Already acted", matched: false });

  // Update reveal
  const { error: updateErr } = await admin
    .from("reveals")
    .update({ action, acted_at: new Date().toISOString() })
    .eq("id", reveal_id);
  if (updateErr)
    return json({ error: updateErr.message, matched: false });

  if (action === "pass") return json({ matched: false });

  // Check mutual dare
  const { data: reverse } = await admin
    .from("reveals")
    .select("id")
    .eq("viewer_id", reveal.answerer_id)
    .eq("answerer_id", reveal.viewer_id)
    .eq("action", "dare")
    .maybeSingle();

  if (!reverse) return json({ matched: false });

  // Insert match with canonical ordering
  const user_a_id =
    reveal.viewer_id < reveal.answerer_id
      ? reveal.viewer_id
      : reveal.answerer_id;
  const user_b_id =
    reveal.viewer_id < reveal.answerer_id
      ? reveal.answerer_id
      : reveal.viewer_id;

  const { error: matchErr } = await admin
    .from("matches")
    .insert({ user_a_id, user_b_id, prompt_id: reveal.prompt_id });
  if (matchErr && !matchErr.message.includes("duplicate"))
    return json({ error: matchErr.message, matched: false });

  return json({ matched: true });
});
