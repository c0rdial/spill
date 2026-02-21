import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers":
          "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader)
    return Response.json({ error: "Missing auth" }, { status: 401 });

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const {
    data: { user },
  } = await admin.auth.getUser(token);
  if (!user)
    return Response.json({ error: "Invalid token" }, { status: 401 });

  const { reveal_id, action } = await req.json();
  if (!reveal_id || !["dare", "pass"].includes(action))
    return Response.json({ error: "Invalid params" }, { status: 400 });

  // Fetch reveal & verify ownership
  const { data: reveal, error: fetchErr } = await admin
    .from("reveals")
    .select("id, viewer_id, answerer_id, prompt_id, action")
    .eq("id", reveal_id)
    .single();
  if (fetchErr || !reveal)
    return Response.json({ error: "Reveal not found" }, { status: 404 });
  if (reveal.viewer_id !== user.id)
    return Response.json({ error: "Not your reveal" }, { status: 403 });
  if (reveal.action !== "pending")
    return Response.json({ error: "Already acted" }, { status: 409 });

  // Update reveal
  const { error: updateErr } = await admin
    .from("reveals")
    .update({ action, acted_at: new Date().toISOString() })
    .eq("id", reveal_id);
  if (updateErr)
    return Response.json({ error: updateErr.message }, { status: 500 });

  if (action === "pass") return Response.json({ matched: false });

  // Check mutual dare
  const { data: reverse } = await admin
    .from("reveals")
    .select("id")
    .eq("viewer_id", reveal.answerer_id)
    .eq("answerer_id", reveal.viewer_id)
    .eq("prompt_id", reveal.prompt_id)
    .eq("action", "dare")
    .maybeSingle();

  if (!reverse) return Response.json({ matched: false });

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
    return Response.json({ error: matchErr.message }, { status: 500 });

  return Response.json({ matched: true });
});
