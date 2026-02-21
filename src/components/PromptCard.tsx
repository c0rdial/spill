import { motion } from "framer-motion";

type Props = {
  text: string;
  onReady: () => void;
};

export function PromptCard({ text, onReady }: Props) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[60vh] px-6"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Today's spill
      </p>
      <h2 className="font-display text-2xl text-spill-text text-center leading-snug mb-10">
        {text}
      </h2>
      <button
        onClick={onReady}
        className="bg-spill-red text-white font-semibold px-8 py-3 rounded-lg"
      >
        Answer this
      </button>
    </motion.div>
  );
}
