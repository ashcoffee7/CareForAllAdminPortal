import type { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: string; // tabler icon suffix, e.g. "check" for "ti-check"
  variant?: 'approve' | 'reject' | 'neutral';
}

const variants: Record<NonNullable<IconButtonProps['variant']>, string> = {
  approve: 'hover:bg-success-light hover:text-success-dark hover:border-[#a7f3d0]',
  reject: 'hover:bg-danger-light hover:text-danger-dark hover:border-[#fecaca]',
  neutral: 'hover:bg-hover-tint hover:text-brand hover:border-brand',
};

export function IconButton({ icon, variant = 'neutral', className = '', ...props }: IconButtonProps) {
  return (
    <button
      className={`w-[30px] h-[30px] rounded-[7px] inline-flex items-center justify-center cursor-pointer border border-border bg-card text-muted text-[14px] transition-colors duration-150 ${variants[variant]} ${className}`}
      {...props}
    >
      <i className={`ti ti-${icon}`} />
    </button>
  );
}
