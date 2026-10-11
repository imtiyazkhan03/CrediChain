import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'verified' | 'pending' | 'revoked' | 'synced' | 'neutral' | 'gold';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = true,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 leading-tight',
    md: 'text-[11px] sm:text-xs px-2.5 py-0.5 leading-normal',
  };

  const variantStyles = {
    verified: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    pending: 'bg-amber-50 text-amber-800 border border-amber-200',
    revoked: 'bg-rose-50 text-rose-800 border border-rose-200',
    synced: 'bg-sky-50 text-sky-800 border border-sky-200',
    gold: 'bg-amber-100/70 text-amber-900 border border-amber-300',
    neutral: 'bg-surface-container text-on-surface border border-surface-container-high',
  };

  const dotColors = {
    verified: 'bg-emerald-500',
    pending: 'bg-amber-500 animate-pulse',
    revoked: 'bg-rose-500',
    synced: 'bg-sky-500',
    gold: 'bg-amber-600',
    neutral: 'bg-outline',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      <span>{children}</span>
    </span>
  );
};
