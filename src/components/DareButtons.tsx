type Props = {
  onDare: () => void;
  onPass: () => void;
  loading: boolean;
};

export function DareButtons({ onDare, onPass, loading }: Props) {
  return (
    <div className="flex gap-4 px-6 mt-8">
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
    </div>
  );
}
