import type { ReactNode } from 'react';

interface StatusPillProps {
  children: ReactNode;
  variant: 'success' | 'danger' | 'warning' | 'neutral';
}

const variants: Record<StatusPillProps['variant'], string> = {
  success: 'bg-success-light text-success-dark',
  danger: 'bg-danger-light text-danger-dark',
  warning: 'bg-warning-light text-warning-dark',
  neutral: 'bg-bg text-muted border border-border',
};

export function StatusPill({ children, variant }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-[10px] py-[3px] rounded-full text-[11px] font-semibold ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
