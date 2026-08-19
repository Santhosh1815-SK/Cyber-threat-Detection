import React from 'react';
import { AlertStatus, IncidentStatus } from '../../types';

interface StatusBadgeProps {
  status: AlertStatus | IncidentStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles: Record<string, { bg: string; text: string; border: string }> = {
    NEW: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-800/60' },
    OPEN: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-800/60' },
    INVESTIGATING: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-800/60' },
    CONTAINED: { bg: 'bg-purple-950/40', text: 'text-purple-400', border: 'border-purple-800/60' },
    RESOLVED: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/60' },
    CLOSED: { bg: 'bg-slate-800/60', text: 'text-slate-400', border: 'border-slate-700/60' },
    FALSE_POSITIVE: { bg: 'bg-slate-800/60', text: 'text-slate-400', border: 'border-slate-700/60' },
  };

  const current = styles[status] || { bg: 'bg-slate-850', text: 'text-slate-300', border: 'border-slate-700' };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
