interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder, className = '' }: SearchBarProps) {
  return (
    <div className={`flex items-center gap-[9px] px-[13px] py-[9px] bg-bg border border-border rounded-lg text-muted text-[13px] ${className}`}>
      <i className="ti ti-search" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-none bg-transparent outline-none text-[13px] text-text w-full font-sans"
      />
    </div>
  );
}
