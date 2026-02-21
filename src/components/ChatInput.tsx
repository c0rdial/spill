import { useState } from "react";

type Props = {
  onSend: (text: string) => void;
  disabled: boolean;
};

export function ChatInput({ onSend, disabled }: Props) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  return (
    <div className="fixed bottom-14 left-0 right-0 bg-spill-bg border-t border-spill-border p-4">
      <div className="max-w-[430px] mx-auto flex gap-3">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Say something..."
          disabled={disabled}
          className="flex-1 bg-spill-card border border-spill-border rounded-full px-4 py-2 text-spill-text placeholder-spill-muted text-sm focus:outline-none focus:border-spill-red"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="bg-gradient-to-r from-spill-red to-spill-orange text-white px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
