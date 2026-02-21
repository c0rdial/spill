import { motion } from "framer-motion";

type Props = {
  onDare: () => void;
  onPass: () => void;
  loading: boolean;
};

export function DareButtons({ onDare, onPass, loading }: Props) {
  return (
    <motion.div
      className="flex gap-4 px-6 mt-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={onPass}
        disabled={loading}
        className="flex-1 border border-spill-border text-spill-muted font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        Pass
      </button>
      <button
        onClick={onDare}
        disabled={loading}
        className="flex-1 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        Dare
      </button>
    </motion.div>
  );
}
