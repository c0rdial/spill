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
        className="relative w-full h-64 cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <motion.div
          className="w-full h-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-spill-card border border-spill-border rounded-2xl flex items-center justify-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-spill-muted text-lg font-medium">
              Tap to reveal
            </p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 bg-spill-card border border-spill-red rounded-2xl flex items-center justify-center px-6"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-spill-text text-lg text-center leading-relaxed">
              {answerText}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
