import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  answerText: string;
  onFlipped: () => void;
};

export function RevealCard({ answerText, onFlipped }: Props) {
  const [flipped, setFlipped] = useState(false);

  function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    onFlipped();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Someone answered...
      </p>
      <div
        className="relative w-full h-72 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <motion.div
          className="w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ type: "tween", duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-spill-card border border-spill-border rounded-2xl flex flex-col items-center justify-center gap-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-spill-muted">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p className="text-spill-muted text-lg font-medium">
              Tap to reveal
            </p>
          </div>
          {/* Back */}
          <motion.div
            className="absolute inset-0 rounded-2xl border border-spill-red flex items-center justify-center px-6"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              background: "linear-gradient(135deg, #2E1065, #1A0A3E)",
            }}
            animate={
              flipped
                ? {
                    boxShadow: [
                      "0 0 40px rgba(188,150,255,0.15)",
                      "0 0 40px rgba(188,150,255,0.35)",
                      "0 0 40px rgba(188,150,255,0.15)",
                    ],
                  }
                : { boxShadow: "0 0 40px rgba(188,150,255,0.15)" }
            }
            transition={
              flipped
                ? { boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
                : {}
            }
          >
            <p className="text-spill-text text-xl text-center leading-relaxed">
              {answerText}
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
