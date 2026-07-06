interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeId: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="flex gap-[2px] border-b border-border mb-5">
      {tabs.map((tab) => {
        const active = tab.id === activeId;
        return (
          <div
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-[18px] py-2 text-[13px] font-semibold cursor-pointer border-b-2 -mb-px transition-colors duration-150 ${
              active ? 'text-brand border-brand' : 'text-muted border-transparent hover:text-text'
            }`}
          >
            {tab.label}
          </div>
        );
      })}
    </div>
  );
}
