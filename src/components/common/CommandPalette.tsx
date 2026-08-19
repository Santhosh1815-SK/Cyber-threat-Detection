import React, { useEffect, useState } from 'react';
import { Search, ShieldAlert, Flame, Radio, Bot, BookOpen, Activity, FileText, X } from 'lucide-react';
import { NavTab } from './Sidebar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onNavigate('dashboard'); // trigger
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  if (!isOpen) return null;

  const quickActions = [
    { label: 'View Threats & Active Alerts', tab: 'alerts' as NavTab, icon: ShieldAlert, category: 'Operations' },
    { label: 'Coordinated Incidents Investigation', tab: 'incidents' as NavTab, icon: Flame, category: 'Operations' },
    { label: 'Open Live SOC Radar Stream', tab: 'live' as NavTab, icon: Radio, category: 'Real-time' },
    { label: 'Ask Sentinel Copilot (AI)', tab: 'copilot' as NavTab, icon: Bot, category: 'AI Intelligence' },
    { label: 'Query RAG Knowledge Base', tab: 'knowledge' as NavTab, icon: BookOpen, category: 'AI Intelligence' },
    { label: 'Inspect ML Models (Isolation Forest & Random Forest)', tab: 'models' as NavTab, icon: Activity, category: 'ML Registry' },
    { label: 'Check System Service Health', tab: 'health' as NavTab, icon: Activity, category: 'System' },
  ];

  const filtered = quickActions.filter(a =>
    a.label.toLowerCase().includes(query.toLowerCase()) || a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center border-b border-slate-800 px-4 py-3 bg-slate-950/60">
          <Search className="h-4 w-4 text-cyan-400 mr-2.5 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command, alert ID (e.g. AL-1042), or prompt Sentinel Copilot..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          <div className="px-2 py-1 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
            Quick Navigation & Actions
          </div>
          {filtered.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onNavigate(action.tab);
                  onClose();
                }}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-cyan-300 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span>{action.label}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{action.category}</span>
              </button>
            );
          })}
        </div>

        <div className="border-t border-slate-800/80 px-4 py-2 bg-slate-950/40 text-[11px] text-slate-500 flex justify-between items-center">
          <span>Navigate with ↵ Enter</span>
          <span className="font-mono text-slate-400">ESC to close</span>
        </div>
      </div>
    </div>
  );
}
