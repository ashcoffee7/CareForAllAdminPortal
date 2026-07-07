import { useEffect, useState } from 'react';
import { api, mutateOrToast } from '../../lib/apiClient';
import { Button } from '../../components/Button';
import type { CheckinDeadline } from '../../types/database';

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'] as const;

interface CheckinDeadlinesFormProps {
  deadlines: Partial<CheckinDeadline>;
  year: number;
  onSaved: () => void;
}

export function CheckinDeadlinesForm({ deadlines, year, onSaved }: CheckinDeadlinesFormProps) {
  const [values, setValues] = useState<Record<string, string>>({
    Q1: deadlines.q1 || '',
    Q2: deadlines.q2 || '',
    Q3: deadlines.q3 || '',
    Q4: deadlines.q4 || '',
  });
  const [status, setStatus] = useState<{ text: string; color: string }>({ text: '', color: 'text-success' });

  useEffect(() => {
    setValues({ Q1: deadlines.q1 || '', Q2: deadlines.q2 || '', Q3: deadlines.q3 || '', Q4: deadlines.q4 || '' });
  }, [deadlines]);

  async function handleSave() {
    const row: Record<string, unknown> = { year };
    QUARTERS.forEach((q) => { row[q.toLowerCase()] = values[q] || null; });

    const ok = await mutateOrToast(api.put('/checkin-deadlines', row), 'Saving check-in deadlines');
    if (!ok) { return; }

    setStatus({ text: 'Saved.', color: 'text-success' });
    setTimeout(() => setStatus({ text: '', color: 'text-success' }), 3000);
    onSaved();
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-[14px]">
        {QUARTERS.map((q) => (
          <div key={q}>
            <label className="block text-[11px] font-bold text-muted uppercase tracking-[0.05em] mb-[6px]">
              {q} {year}
            </label>
            <input
              type="date"
              value={values[q]}
              onChange={(e) => setValues((prev) => ({ ...prev, [q]: e.target.value }))}
              className="w-full px-[13px] py-[9px] border border-border rounded-lg text-[13px] text-text bg-bg outline-none font-sans transition-colors duration-150 focus:border-brand focus:bg-white"
            />
          </div>
        ))}
      </div>
      <Button variant="primary" className="mt-[14px]" onClick={handleSave}>Save Deadlines</Button>
      <span className={`text-[12px] ml-3 ${status.color}`}>{status.text}</span>
    </div>
  );
}
