const options = ["man", "woman", "nonbinary"] as const;
const labels: Record<(typeof options)[number], string> = {
  man: "Men",
  woman: "Women",
  nonbinary: "Nonbinary",
};

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function ShowMeSelect({ value, onChange }: Props) {
  function toggle(opt: string) {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  }

  return (
    <div className="flex gap-3">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
            value.includes(opt)
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
