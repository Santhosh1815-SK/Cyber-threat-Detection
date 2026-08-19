import React from 'react';
import { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
  showDot?: boolean;
  className?: string;
}

export function SeverityBadge({ severity, showDot = true, className = '' }: SeverityBadgeProps) {
  const styles: Record<Severity, { bg: string; text: string; border: string; dot: string }> = {
    CRITICAL: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-400',
      border: 'border-rose-800/60',
      dot: 'bg-rose-500 animate-pulse',
    },
    HIGH: {
      bg: 'bg-orange-950/40',
      text: 'text-orange-400',
      border: 'border-orange-800/60',
      dot: 'bg-orange-500',
    },
    MEDIUM: {
      bg: 'bg-amber-950/40',
      text: 'text-amber-400',
      border: 'border-amber-800/60',
      dot: 'bg-amber-500',
    },
    LOW: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-800/60',
      dot: 'bg-emerald-500',
    },
  };

  const current = styles[severity] || styles.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />}
      {severity}
    </span>
  );
}
