import { useState } from "react";
import { motion } from "framer-motion";

type Props = {
  onSubmit: (text: string) => void;
  loading: boolean;
};

export function AnswerInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Your answer
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={400}
        rows={4}
        placeholder="Say something real..."
        className="w-full bg-spill-card border border-spill-border rounded-lg px-4 py-3 text-spill-text placeholder-spill-muted resize-none focus:outline-none focus:border-spill-red text-lg"
      />
      <p className="text-spill-muted text-xs mt-2 self-end">{400 - text.length}</p>
      <motion.button
        onClick={() => onSubmit(text)}
        disabled={loading || !text.trim()}
        whileTap={{ scale: 0.97 }}
        className="w-full mt-6 bg-gradient-to-r from-spill-red to-spill-orange text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        {loading ? "Submitting..." : "Spill it"}
      </motion.button>
    </motion.div>
  );
}
