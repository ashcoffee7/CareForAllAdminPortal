interface Option<T extends string> {
  value: T;
  label: string;
}

interface FilterChipsProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function FilterChips<T extends string>({ options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <div
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-[13px] py-[6px] rounded-full text-[12px] font-semibold cursor-pointer border ${
            opt.value === value
              ? 'bg-brand text-white border-brand'
              : 'bg-card text-muted border-border'
          }`}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}
