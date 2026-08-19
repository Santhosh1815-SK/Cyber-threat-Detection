import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Bell,
  Sparkles,
  RefreshCw,
  Sliders,
  User,
  LogOut,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import { api } from '../../lib/api';

interface NavbarProps {
  onOpenCommandPalette: () => void;
  onToggleFloatingCopilot: () => void;
  currentPageTitle: string;
}

export function Navbar({ onOpenCommandPalette, onToggleFloatingCopilot, currentPageTitle }: NavbarProps) {
  const { user, role, logout, switchRole } = useAuth();
  const { isConnected, isSimulating, toggleSimulation } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoDataset();
      window.location.reload();
    } catch (err) {
      console.error('Reset error:', err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/90 px-4 backdrop-blur-md lg:px-6">
      {/* Left: Branding & Page Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-500 shadow-md shadow-indigo-500/20">
            <ShieldAlert className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white font-mono text-base">SENTINEL<span className="text-cyan-400">.AI</span></span>
              <span className="hidden sm:inline-flex rounded border border-cyan-500/30 bg-cyan-950/40 px-1.5 py-0.2 text-[10px] font-mono text-cyan-300">
                SOC v1.2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">Intelligent Threat Operations</p>
          </div>
        </div>

        <div className="hidden h-5 w-px bg-slate-800 lg:block" />

        <div className="hidden items-center gap-2 lg:flex">
          <span className="text-sm font-medium text-slate-300">{currentPageTitle}</span>
        </div>
      </div>

      {/* Center: Global Search trigger */}
      <div className="hidden md:flex flex-1 max-w-md mx-6">
        <button
          onClick={onOpenCommandPalette}
          className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-1.5 text-xs text-slate-400 shadow-inner hover:border-slate-700 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <span>Search alerts, IP indicators, CVEs, or ask Copilot...</span>
          </div>
          <kbd className="rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Stream status, Copilot toggle, Notifications, Role Switcher, Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Live Stream Telemetry Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-1 text-xs">
          <span className="relative flex h-2 w-2">
            <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          <span className="text-[11px] font-mono text-slate-300">
            {isConnected ? 'LIVE STREAM' : 'RECONNECTING'}
          </span>
          <button
            onClick={toggleSimulation}
            title={isSimulating ? 'Pause Synthetic Stream Generator' : 'Resume Synthetic Stream Generator'}
            className="ml-1 text-slate-400 hover:text-slate-200"
          >
            {isSimulating ? <Pause className="h-3 w-3 text-cyan-400" /> : <Play className="h-3 w-3 text-slate-400" />}
          </button>
        </div>

        {/* Load / Reset Demo Data Button */}
        <button
          onClick={handleResetDemo}
          disabled={isResetting}
          title="Reload Demo Cybersecurity Dataset"
          className="hidden xl:flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Demo Data</span>
        </button>

        {/* AI Copilot Quick Launch Button */}
        <button
          onClick={onToggleFloatingCopilot}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-cyan-500 transition-all"
        >
          <Sparkles className="h-3.5 w-3.5 text-cyan-200 animate-pulse" />
          <span className="hidden sm:inline">Copilot AI</span>
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white">
              2
            </span>
          </button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        {/* Role Switcher & User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/80 p-1.5 hover:border-slate-700 transition-colors"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-xs font-bold text-cyan-400">
              {user?.name?.slice(0, 2).toUpperCase() || 'SA'}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-medium text-slate-200 leading-none">{user?.name}</p>
              <span className="text-[10px] font-mono text-cyan-400 font-semibold">{role}</span>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl z-50">
              <div className="border-b border-slate-800 px-3 py-2">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-cyan-400">
                    ROLE: {role}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                  </span>
                </div>
              </div>

              {/* RBAC Role Switcher for instant testing */}
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Simulate Role (RBAC)
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {(['ADMIN', 'ANALYST', 'VIEWER'] as const).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setShowUserMenu(false);
                      }}
                      className={`rounded px-1.5 py-1 text-[10px] font-mono font-medium transition-colors ${
                        role === r
                          ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
