import { useState } from "react";

type Props = {
  onSubmit: (text: string) => void;
  loading: boolean;
};

export function AnswerInput({ onSubmit, loading }: Props) {
  const [text, setText] = useState("");

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
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
      <button
        onClick={() => onSubmit(text)}
        disabled={loading || !text.trim()}
        className="w-full mt-6 bg-spill-red text-white font-semibold py-3 rounded-lg disabled:opacity-50 transition-opacity"
      >
        {loading ? "Submitting..." : "Spill it"}
      </button>
    </div>
  );
}
