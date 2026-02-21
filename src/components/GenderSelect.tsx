const options = ["man", "woman", "nonbinary"] as const;
const labels: Record<(typeof options)[number], string> = {
  man: "Man",
  woman: "Woman",
  nonbinary: "Nonbinary",
};

type Props = {
  value: string | null;
  onChange: (value: string) => void;
};

export function GenderSelect({ value, onChange }: Props) {
  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
            value === opt
              ? "bg-spill-red text-white"
              : "bg-spill-card border border-spill-border text-spill-muted"
          }`}
        >
          {labels[opt]}
        </button>
      ))}
    </div>
  );
}
