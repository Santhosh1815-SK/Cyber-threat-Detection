import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Flame,
  Radio,
  ScrollText,
  Globe2,
  BarChart3,
  Bot,
  BookOpen,
  Cpu,
  Users,
  History,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'alerts'
  | 'incidents'
  | 'live'
  | 'events'
  | 'geo'
  | 'analytics'
  | 'copilot'
  | 'knowledge'
  | 'models'
  | 'users'
  | 'audit'
  | 'health'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeTab, onSelectTab, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { role } = useAuth();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'SOC Dashboard', icon: LayoutDashboard, category: 'OPERATIONS' },
    { id: 'alerts' as NavTab, label: 'Threats & Alerts', icon: ShieldAlert, badge: '4', category: 'OPERATIONS' },
    { id: 'incidents' as NavTab, label: 'Incident Response', icon: Flame, badge: '1', category: 'OPERATIONS' },
    { id: 'live' as NavTab, label: 'Live SOC Radar', icon: Radio, category: 'OPERATIONS' },
    { id: 'events' as NavTab, label: 'Security Event Logs', icon: ScrollText, category: 'OPERATIONS' },

    { id: 'geo' as NavTab, label: 'Geo Threat Map', icon: Globe2, category: 'INTELLIGENCE' },
    { id: 'analytics' as NavTab, label: 'Security Analytics', icon: BarChart3, category: 'INTELLIGENCE' },
    { id: 'copilot' as NavTab, label: 'Sentinel Copilot', icon: Bot, isAi: true, category: 'AI & KNOWLEDGE' },
    { id: 'knowledge' as NavTab, label: 'RAG Knowledge Base', icon: BookOpen, category: 'AI & KNOWLEDGE' },
    { id: 'models' as NavTab, label: 'ML Model Registry', icon: Cpu, category: 'AI & KNOWLEDGE' },

    { id: 'users' as NavTab, label: 'Users & RBAC', icon: Users, adminOnly: true, category: 'GOVERNANCE' },
    { id: 'audit' as NavTab, label: 'Audit Trail', icon: History, category: 'GOVERNANCE' },
    { id: 'health' as NavTab, label: 'System Health', icon: Activity, category: 'GOVERNANCE' },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings, category: 'GOVERNANCE' },
  ];

  // Filter based on RBAC
  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && role !== 'ADMIN') return false;
    return true;
  });

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 z-20 flex flex-col border-r border-slate-800/80 bg-slate-950/95 transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/60 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-cyan-400'
                    : item.isAi
                    ? 'text-indigo-400 group-hover:text-indigo-300'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!isCollapsed && (
                <div className="flex flex-1 items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.isAi ? (
                    <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-mono text-indigo-300 uppercase">
                      AI
                    </span>
                  ) : item.badge ? (
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="border-t border-slate-800/80 p-2">
        <button
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
