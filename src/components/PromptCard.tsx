type Props = {
  text: string;
  onReady: () => void;
};

export function PromptCard({ text, onReady }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <p className="text-spill-muted text-sm font-medium uppercase tracking-wider mb-6">
        Today's spill
      </p>
      <h2 className="text-2xl font-bold text-spill-text text-center leading-snug mb-10">
        {text}
      </h2>
      <button
        onClick={onReady}
        className="bg-spill-red text-white font-semibold px-8 py-3 rounded-lg"
      >
        Answer this
      </button>
    </div>
  );
}
