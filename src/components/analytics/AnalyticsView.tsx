import React from 'react';
import { BarChart3, ShieldCheck, Zap, AlertTriangle, Target, Activity, CheckCircle2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';

export function AnalyticsView() {
  const mitreCoverage = [
    { tactic: 'Initial Access', count: 18, technique: 'T1078 Valid Accounts / T1190 Exploit Facing App' },
    { tactic: 'Execution', count: 9, technique: 'T1059 Command Scripting' },
    { tactic: 'Persistence', count: 14, technique: 'T1136 Create Account' },
    { tactic: 'Privilege Escalation', count: 12, technique: 'T1068 Exploitation for Privilege' },
    { tactic: 'Defense Evasion', count: 21, technique: 'T1070 Indicator Removal' },
    { tactic: 'Credential Access', count: 46, technique: 'T1110 Brute Force / Password Spray' },
    { tactic: 'Discovery', count: 34, technique: 'T1046 Network Service Discovery' },
    { tactic: 'Exfiltration', count: 19, technique: 'T1048 Exfiltration Over Protocol' },
    { tactic: 'Impact', count: 8, technique: 'T1499 Endpoint DoS' },
  ];

  const targetedPortsData = [
    { port: '22 (SSH)', count: 142, protocol: 'TCP' },
    { port: '443 (HTTPS)', count: 98, protocol: 'TCP' },
    { port: '80 (HTTP)', count: 64, protocol: 'TCP' },
    { port: '3389 (RDP)', count: 52, protocol: 'TCP' },
    { port: '53 (DNS)', count: 31, protocol: 'UDP' },
    { port: '8080 (Proxy)', count: 24, protocol: 'TCP' },
  ];

  const authFailuresTrend = [
    { day: 'Mon', attempts: 420, failures: 42 },
    { day: 'Tue', attempts: 580, failures: 65 },
    { day: 'Wed', attempts: 940, failures: 380 }, // spike
    { day: 'Thu', attempts: 610, failures: 82 },
    { day: 'Fri', attempts: 490, failures: 51 },
    { day: 'Sat', attempts: 320, failures: 38 },
    { day: 'Sun', attempts: 290, failures: 29 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-cyan-400" />
            SECURITY ANALYTICS & MITRE ATT&CK MATRIX
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise threat telemetry correlation, port vulnerability scans, and MITRE adversary tactic mapping.
          </p>
        </div>
      </div>

      {/* MITRE ATT&CK Matrix Coverage Breakdown */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">MITRE ATT&CK Enterprise Tactic Coverage</h3>
            <p className="text-xs text-slate-400">Classified alert volume across the 9 primary cyber kill-chain phases</p>
          </div>
          <span className="text-xs font-mono text-cyan-400">Framework v14.1</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
          {mitreCoverage.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  Phase 0{idx + 1}
                </span>
                <p className="text-xs font-bold text-slate-200 mt-1 leading-tight">{item.tactic}</p>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-800">
                <span className="text-lg font-bold font-mono text-cyan-400">{item.count}</span>
                <span className="text-[10px] text-slate-500 block">detections</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row: Targeted Ports & Auth Failures Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Targeted Ports */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md">
          <h3 className="text-sm font-semibold text-white">Most Targeted Destination Ports</h3>
          <p className="text-xs text-slate-400 mb-4">Network port probes and connection attempts</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={targetedPortsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="port" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]}>
                  {targetedPortsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? '#f43f5e' : index === 1 ? '#fb923c' : '#06b6d4'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Authentication Anomalies Trend */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md">
          <h3 className="text-sm font-semibold text-white">Authentication Attempts vs Failed Logins</h3>
          <p className="text-xs text-slate-400 mb-4">Correlation of login volume and brute force spikes</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={authFailuresTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line type="monotone" dataKey="attempts" stroke="#38bdf8" strokeWidth={2} name="Total Logins" />
                <Line type="monotone" dataKey="failures" stroke="#f43f5e" strokeWidth={2} name="Failed Logins" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
