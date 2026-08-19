import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Flame,
  Activity,
  CheckCircle2,
  TrendingUp,
  Radio,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Globe2,
  Clock,
  Sparkles,
  Play,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../../lib/api';
import { Alert, DashboardSummary, SecurityEvent } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { formatTimeAgo } from '../../lib/utils';
import { NavTab } from '../common/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectAlert: (alertId: string) => void;
}

export function DashboardView({ onNavigate, onSelectAlert }: DashboardViewProps) {
  const { liveEvents, triggerAttackSimulation } = useSocket();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sumData, alertsData] = await Promise.all([
        api.getDashboardSummary(),
        api.getAlerts({ severity: 'ALL' }),
      ]);
      setSummary(sumData);
      setCriticalAlerts(alertsData.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data
  const timeSeriesData = [
    { time: '00:00', normal: 120, threats: 4, anomalies: 8 },
    { time: '04:00', normal: 95, threats: 12, anomalies: 15 },
    { time: '08:00', normal: 240, threats: 6, anomalies: 10 },
    { time: '12:00', normal: 380, threats: 18, anomalies: 22 },
    { time: '16:00', normal: 420, threats: 24, anomalies: 30 },
    { time: '20:00', normal: 310, threats: 15, anomalies: 18 },
    { time: '23:59', normal: 210, threats: 8, anomalies: 12 },
  ];

  const categoryData = [
    { name: 'Brute Force', count: 42, color: '#f43f5e' },
    { name: 'Port Scan', count: 35, color: '#fb923c' },
    { name: 'Data Exfil', count: 18, color: '#e11d48' },
    { name: 'DDoS Burst', count: 28, color: '#f59e0b' },
    { name: 'SQL Injection', count: 14, color: '#8b5cf6' },
    { name: 'Malware Beacon', count: 9, color: '#06b6d4' },
  ];

  const severityPieData = [
    { name: 'Critical', value: summary?.critical_alerts || 2, color: '#f43f5e' },
    { name: 'High', value: summary?.high_alerts || 4, color: '#fb923c' },
    { name: 'Medium', value: summary?.medium_alerts || 6, color: '#f59e0b' },
    { name: 'Low', value: summary?.low_alerts || 12, color: '#10b981' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner: Real-Time Stream Status & Simulation Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 p-4 sm:p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-lg font-bold text-white font-mono tracking-tight">
              SENTINEL SOC OPERATIONS CENTER
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time ML threat detection active. Isolation Forest & Random Forest models evaluating telemetry.
          </p>
        </div>

        {/* Attack Simulator Quick Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 mr-1 hidden lg:inline">
            INJECT ATTACK:
          </span>
          <button
            onClick={() => triggerAttackSimulation('BRUTE_FORCE')}
            className="rounded-lg border border-rose-800/60 bg-rose-950/40 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-900/50 transition-colors"
          >
            SSH Brute Force
          </button>
          <button
            onClick={() => triggerAttackSimulation('PORT_SCAN')}
            className="rounded-lg border border-orange-800/60 bg-orange-950/40 px-2.5 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-900/50 transition-colors"
          >
            Port Sweep
          </button>
          <button
            onClick={() => triggerAttackSimulation('DATA_EXFILTRATION')}
            className="rounded-lg border border-pink-800/60 bg-pink-950/40 px-2.5 py-1.5 text-xs font-semibold text-pink-300 hover:bg-pink-900/50 transition-colors"
          >
            Data Exfil
          </button>
          <button
            onClick={() => triggerAttackSimulation('DDOS_BURST')}
            className="rounded-lg border border-amber-800/60 bg-amber-950/40 px-2.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-900/50 transition-colors"
          >
            DDoS Burst
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        {/* Total Ingested Events */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Events Ingested</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              {(summary?.total_events || 250).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[10px] text-cyan-400 font-mono">~142 events/sec</p>
        </div>

        {/* Threats Detected */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Threats Detected</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400 font-mono">
              {summary?.threats_detected || 4}
            </span>
            <span className="text-xs text-rose-400/80">flagged</span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400">97.4% Detection Rate</p>
        </div>

        {/* Critical Alerts */}
        <div className="rounded-xl border border-rose-900/40 bg-rose-950/20 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-rose-300 uppercase tracking-wider">Critical Alerts</span>
            <AlertTriangle className="h-4 w-4 text-rose-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-300 font-mono">
              {summary?.critical_alerts || 2}
            </span>
            <span className="text-xs text-rose-400">action required</span>
          </div>
          <button
            onClick={() => onNavigate('alerts')}
            className="mt-1 text-[10px] text-rose-400 hover:underline font-mono flex items-center gap-0.5"
          >
            Review Alerts →
          </button>
        </div>

        {/* Active Incidents */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <Flame className="h-4 w-4 text-orange-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-orange-400 font-mono">
              {summary?.active_incidents || 1}
            </span>
          </div>
          <button
            onClick={() => onNavigate('incidents')}
            className="mt-1 text-[10px] text-orange-400 hover:underline font-mono flex items-center gap-0.5"
          >
            View Triage →
          </button>
        </div>

        {/* Composite Risk Score */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Composite Risk</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400 font-mono">
              {summary?.avg_risk_score || 38}<span className="text-xs text-slate-500">/100</span>
            </span>
          </div>
          <p className="mt-1 text-[10px] text-amber-400/80 font-mono">Elevated Threat Surface</p>
        </div>

        {/* System Health Status */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">ML Pipeline</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-base font-bold text-emerald-400 font-mono">
              NOMINAL
            </span>
          </div>
          <p className="mt-1 text-[10px] text-slate-400 font-mono">Latency 3.8ms</p>
        </div>
      </div>

      {/* Main Grid: Charts & Visuals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Threats Over Time Chart (2 Cols) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 lg:col-span-2 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Threat Volume & Telemetry Activity</h3>
              <p className="text-xs text-slate-400">Time-series correlation over 24-hour monitoring window</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Normal Traffic
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Threats Blocked
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="normal" stroke="#06b6d4" fillOpacity={1} fill="url(#colorNormal)" />
                <Area type="monotone" dataKey="threats" stroke="#f43f5e" fillOpacity={1} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Alert Severity Distribution</h3>
            <p className="text-xs text-slate-400">Current active alert hierarchy</p>
          </div>

          <div className="h-44 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {severityPieData.map(s => (
              <div key={s.name} className="flex items-center justify-between rounded bg-slate-950/60 px-2 py-1">
                <span className="flex items-center gap-1.5" style={{ color: s.color }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold text-white">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Attack Categories & Recent Critical Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Attack Categories Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md">
          <h3 className="text-sm font-semibold text-white">Top Threat Vectors</h3>
          <p className="text-xs text-slate-400 mb-4">Classified by Random Forest ensemble</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Critical Alerts Table (2 Cols) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 lg:col-span-2 shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">High Priority Security Alerts</h3>
                <p className="text-xs text-slate-400">Triggered by ML anomaly score threshold violations</p>
              </div>
              <button
                onClick={() => onNavigate('alerts')}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                View All ({criticalAlerts.length}) →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="pb-2.5">Alert ID</th>
                    <th className="pb-2.5">Threat Classification</th>
                    <th className="pb-2.5">Adversary Source</th>
                    <th className="pb-2.5">Severity</th>
                    <th className="pb-2.5">Risk</th>
                    <th className="pb-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {criticalAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-cyan-400">{alert.id}</td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-200 truncate max-w-xs">{alert.title}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Target: {alert.affected_asset}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {alert.source_ip}
                        <span className="block text-[10px] text-slate-500">{alert.country}</span>
                      </td>
                      <td className="py-3">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-400">
                        {alert.risk_score}/100
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onSelectAlert(alert.id)}
                          className="rounded bg-slate-800 hover:bg-cyan-600 hover:text-white px-2.5 py-1 text-[11px] font-mono text-cyan-300 transition-colors"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
