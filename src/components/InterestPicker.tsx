import type { InterestTag } from "../lib/types";

type Props = {
  tags: InterestTag[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function InterestPicker({ tags, selected, onChange }: Props) {
  function toggle(label: string) {
    if (selected.includes(label)) {
      onChange(selected.filter((s) => s !== label));
    } else {
      onChange([...selected, label]);
    }
  }

  const grouped = tags.reduce<Record<string, InterestTag[]>>((acc, tag) => {
    (acc[tag.category] ??= []).push(tag);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, categoryTags]) => (
        <div key={category}>
          <p className="text-spill-muted text-xs font-medium uppercase tracking-wider mb-3">
            {category}
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.label)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selected.includes(tag.label)
                    ? "bg-spill-red text-white"
                    : "bg-spill-card border border-spill-border text-spill-muted"
                }`}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
