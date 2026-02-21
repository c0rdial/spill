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
import { DecoShapes } from "../components/DecoShapes";
import type { Shape } from "../components/DecoShapes";

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
      const { data, error } = await supabase
        .from("answers")
        .select("id")
        .eq("user_id", user!.id)
        .eq("prompt_id", prompt!.id)
        .maybeSingle();
      if (error) throw error;
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

    const { data, error } = await supabase.functions.invoke("dare", {
      body: { reveal_id: currentReveal.out_reveal_id, action },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    if (data.matched) {
      setMatchAlert(true);
    }

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
        {matchAlert && <MatchCeremony onDismiss={() => setMatchAlert(false)} />}
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
            <p className="text-center text-spill-muted text-sm px-6 mt-2 mb-2">
              {prompt.text}
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
        ) : alreadyAnswered ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
            <p className="font-display italic text-3xl font-bold mb-2 text-spill-green">
              You spilled it.
            </p>
            <p className="text-spill-muted text-center">
              Come back tomorrow — new prompt, new vibes.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
            <p className="text-spill-text text-xl font-bold mb-2">
              Still brewing...
            </p>
            <p className="text-spill-muted text-center">
              Not enough spills yet. Check back in a bit!
            </p>
          </div>
        ))}
      {phase === "done" && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
          <p className="font-display italic text-3xl font-bold mb-2 text-spill-green">
            You spilled it.
          </p>
          <p className="text-spill-muted text-center">
            Come back tomorrow — new prompt, new vibes.
          </p>
        </div>
      )}
    </div>
  );
}

const MATCH_SHAPES: Shape[] = [
  { type: "heart", color: "#FF3B6F", x: 8, y: 8, size: 36, rotate: -15, delay: 0.05 },
  { type: "heart", color: "#BC96FF", x: 75, y: 72, size: 44, rotate: 20, delay: 0.15 },
  { type: "star", color: "#D7FF81", x: 82, y: 10, size: 28, rotate: 12, delay: 0.1 },
  { type: "star", color: "#D7FF81", x: 20, y: 78, size: 20, rotate: -30, delay: 0.25 },
  { type: "triangle", color: "#FAFAFA", x: 60, y: 5, size: 24, rotate: 25, delay: 0.08 },
  { type: "triangle", color: "#FF3B6F", x: 5, y: 60, size: 20, rotate: -45, delay: 0.2 },
  { type: "circle", color: "#D7FF81", x: 88, y: 45, size: 32, rotate: 0, delay: 0.12 },
  { type: "circle", color: "#BC96FF", x: 15, y: 35, size: 18, rotate: 0, delay: 0.18 },
  { type: "blob", color: "#BC96FF", x: 50, y: 82, size: 30, rotate: 40, delay: 0.22 },
  { type: "heart", color: "#FF3B6F", x: 40, y: 3, size: 22, rotate: 10, delay: 0.14 },
];

function MatchCeremony({ onDismiss }: { onDismiss: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-spill-bg/95 backdrop-blur-md flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DecoShapes shapes={MATCH_SHAPES} />
      <div className="relative text-center z-10">
        <motion.p
          className="font-display italic text-4xl text-spill-text mb-2"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          It's a{" "}
          <span className="text-spill-green">match</span>.
        </motion.p>
        <motion.p
          className="text-spill-muted mb-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          Go say something real.
        </motion.p>
        <motion.button
          onClick={onDismiss}
          whileTap={{ scale: 0.97 }}
          className="bg-spill-red text-white font-semibold px-8 py-3 rounded-lg"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          Keep going
        </motion.button>
      </div>
    </motion.div>
  );
}
