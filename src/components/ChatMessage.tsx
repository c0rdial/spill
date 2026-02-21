import { motion } from "framer-motion";
import type { Message } from "../lib/types";

type Props = {
  message: Message;
  isOwn: boolean;
};

export function ChatMessage({ message, isOwn }: Props) {
  return (
    <motion.div
      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwn
            ? "bg-gradient-to-r from-spill-red to-spill-orange text-white rounded-br-sm"
            : "bg-spill-card text-spill-text border border-spill-border rounded-bl-sm"
        }`}
      >
        <p className="text-sm">{message.text}</p>
      </div>
    </motion.div>
  );
}
