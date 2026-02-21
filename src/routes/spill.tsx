import { createRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { protectedLayout } from "./_protected";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { useUser } from "../hooks/useUser";
import { useTodayPrompt } from "../hooks/useTodayPrompt";
import { useReveals } from "../hooks/useReveals";
import type { RevealResult } from "../hooks/useReveals";
import { PromptCard } from "../components/PromptCard";
import { AnswerInput } from "../components/AnswerInput";
import { RevealCard } from "../components/RevealCard";
import { DareButtons } from "../components/DareButtons";

export const spillRoute = createRoute({
  getParentRoute: () => protectedLayout,
  path: "/spill",
  component: SpillPage,
});

type Phase = "prompt" | "answer" | "reveals" | "done";

function SpillPage() {
  const { session } = useAuth();
  const { data: user } = useUser(session?.user?.id);
  const { data: prompt, isLoading: promptLoading } = useTodayPrompt();

  const { data: existingAnswer, isLoading: answerLoading } = useQuery({
    queryKey: ["myAnswer", user?.id, prompt?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("answers")
        .select("id")
        .eq("user_id", user!.id)
        .eq("prompt_id", prompt!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && !!prompt,
  });

  const alreadyAnswered = !!existingAnswer;
  const [userPhase, setUserPhase] = useState<Phase | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [matchAlert, setMatchAlert] = useState(false);

  const phase: Phase = userPhase ?? (alreadyAnswered ? "reveals" : "prompt");

  const {
    data: reveals,
    isLoading: revealsLoading,
    refetch: fetchReveals,
  } = useReveals(
    alreadyAnswered || phase === "reveals" || phase === "done" ? user?.id : undefined,
    alreadyAnswered || phase === "reveals" || phase === "done" ? prompt?.id : undefined,
  );

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("match-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          const m = payload.new as { user_a_id: string; user_b_id: string };
          if (m.user_a_id === user.id || m.user_b_id === user.id) {
            setMatchAlert(true);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function submitAnswer(text: string) {
    if (!prompt || !user) return;
    setLoading(true);
    const { error } = await supabase.from("answers").insert({
      user_id: user.id,
      prompt_id: prompt.id,
      text,
    });
    if (error) {
      alert(error.message);
    } else {
      await fetchReveals();
      setUserPhase("reveals");
    }
    setLoading(false);
  }

  const currentReveal: RevealResult | undefined = reveals?.[currentIndex];

  async function handleAction(action: "dare" | "pass") {
    if (!currentReveal) return;
    setLoading(true);
    await supabase
      .from("reveals")
      .update({ action, acted_at: new Date().toISOString() })
      .eq("id", currentReveal.out_reveal_id);

    const nextIndex = currentIndex + 1;
    if (nextIndex < (reveals?.length ?? 0)) {
      setCurrentIndex(nextIndex);
      setFlipped(false);
    } else {
      setUserPhase("done");
    }
    setLoading(false);
  }

  if (promptLoading || answerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-spill-muted">Loading today's spill...</p>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-spill-muted">No prompt today. Check back tomorrow.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-spill-bg pb-20">
      <AnimatePresence>
        {matchAlert && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="font-display italic text-4xl text-spill-text mb-2">
                It's a match.
              </p>
              <p className="text-spill-muted mb-6">Go say something real.</p>
              <button
                onClick={() => setMatchAlert(false)}
                className="bg-spill-red text-white font-semibold px-8 py-3 rounded-lg"
              >
                Keep going
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === "prompt" && (
        <PromptCard text={prompt.text} onReady={() => setUserPhase("answer")} />
      )}
      {phase === "answer" && (
        <AnswerInput onSubmit={submitAnswer} loading={loading} />
      )}
      {phase === "reveals" &&
        (revealsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="text-spill-muted">Finding people...</p>
          </div>
        ) : reveals && reveals.length > 0 && currentReveal ? (
          <div>
            <p className="text-center text-spill-muted text-sm pt-6">
              {currentIndex + 1} of {reveals.length}
            </p>
            <RevealCard
              key={currentReveal.out_reveal_id}
              answerText={currentReveal.out_answer_text}
              onFlipped={() => setFlipped(true)}
            />
            {flipped && (
              <DareButtons
                onDare={() => handleAction("dare")}
                onPass={() => handleAction("pass")}
                loading={loading}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
            <p className="text-spill-text text-xl font-bold mb-2">
              Not enough spills yet
            </p>
            <p className="text-spill-muted text-center">
              Check back later today.
            </p>
          </div>
        ))}
      {phase === "done" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <p className="text-spill-text text-2xl font-bold mb-2">
            You've spilled for today
          </p>
          <p className="text-spill-muted text-center">
            Check back tomorrow for a new prompt.
          </p>
        </div>
      )}
    </div>
  );
}
