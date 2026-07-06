interface Option<T extends string> {
  value: T;
  label: string;
}

interface SegmentedToggleProps<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

export function SegmentedToggle<T extends string>({ options, value, onChange }: SegmentedToggleProps<T>) {
  return (
    <div className="inline-flex bg-bg border border-border rounded-[9px] p-[3px] gap-[2px]">
      {options.map((opt) => (
        <div
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-[14px] py-[6px] text-[12px] font-bold rounded-[7px] cursor-pointer transition-colors duration-150 ${
            opt.value === value ? 'bg-brand text-white' : 'text-muted'
          }`}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );
}
