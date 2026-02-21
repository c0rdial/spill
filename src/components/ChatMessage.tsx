import type { Message } from "../lib/types";

type Props = {
  message: Message;
  isOwn: boolean;
};

export function ChatMessage({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
          isOwn
            ? "bg-spill-red text-white rounded-br-sm"
            : "bg-spill-card text-spill-text border border-spill-border rounded-bl-sm"
        }`}
      >
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
}
