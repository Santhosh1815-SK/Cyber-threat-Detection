import React from 'react';
import { Users, Shield, Lock, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export function UsersManagementView() {
  const { user, role, switchRole } = useAuth();

  const usersList = [
    {
      name: 'Sarah Vance',
      email: 'admin@sentinel.ai',
      role: 'ADMIN' as UserRole,
      dept: 'Global Security Operations',
      lastActive: 'Just now',
    },
    {
      name: 'Marcus Thorne',
      email: 'analyst@sentinel.ai',
      role: 'ANALYST' as UserRole,
      dept: 'SOC Incident Response Tier-2',
      lastActive: '5m ago',
    },
    {
      name: 'Elena Rostova',
      email: 'viewer@sentinel.ai',
      role: 'VIEWER' as UserRole,
      dept: 'Compliance & Audit Oversight',
      lastActive: '2h ago',
    },
  ];

  const permissionsMatrix = [
    { permission: 'View Dashboard & Telemetry Stream', admin: true, analyst: true, viewer: true },
    { permission: 'Inspect Alerts & Explainable AI', admin: true, analyst: true, viewer: true },
    { permission: 'Execute Containment (IP Block, Host Isolation)', admin: true, analyst: true, viewer: false },
    { permission: 'Create & Triage Incident Cases', admin: true, analyst: true, viewer: false },
    { permission: 'Post Analyst Investigation Notes', admin: true, analyst: true, viewer: false },
    { permission: 'Upload RAG Knowledge Documents', admin: true, analyst: true, viewer: false },
    { permission: 'Manage Users & RBAC Permissions', admin: true, analyst: false, viewer: false },
    { permission: 'Delete Indexed Knowledge Base Files', admin: true, analyst: false, viewer: false },
    { permission: 'Adjust ML Anomaly Score Thresholds', admin: true, analyst: false, viewer: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-400" />
            USERS & ROLE-BASED ACCESS CONTROL (RBAC)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage SOC analyst accounts, security clearance tiers, and enforcement boundaries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Current Session Role:</span>
          <span className="rounded bg-cyan-950 px-2 py-0.5 text-xs font-mono font-bold text-cyan-300 border border-cyan-500/40">
            {role}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md space-y-4">
        <h3 className="text-sm font-semibold text-white">Authorized SOC Personnel</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2.5">Analyst Name</th>
                <th className="pb-2.5">Email Address</th>
                <th className="pb-2.5">Role</th>
                <th className="pb-2.5">Department</th>
                <th className="pb-2.5">Last Active</th>
                <th className="pb-2.5 text-right">Switch Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {usersList.map(u => (
                <tr key={u.email} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-semibold text-slate-200">{u.name}</td>
                  <td className="py-3 font-mono text-slate-400">{u.email}</td>
                  <td className="py-3 font-mono">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        u.role === 'ADMIN'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60'
                          : u.role === 'ANALYST'
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{u.dept}</td>
                  <td className="py-3 font-mono text-slate-400">{u.lastActive}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => switchRole(u.role)}
                      className="rounded bg-slate-800 hover:bg-cyan-600 hover:text-white px-2.5 py-1 text-[11px] font-mono text-cyan-300 transition-colors"
                    >
                      Assume Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permissions Matrix */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md space-y-4">
        <h3 className="text-sm font-semibold text-white">RBAC Permission Enforcement Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2.5">Security Capability</th>
                <th className="pb-2.5 text-center font-bold text-rose-400">ADMIN</th>
                <th className="pb-2.5 text-center font-bold text-cyan-400">ANALYST</th>
                <th className="pb-2.5 text-center font-bold text-slate-400">VIEWER</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {permissionsMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-medium text-slate-200">{item.permission}</td>
                  <td className="py-3 text-center">
                    {item.admin ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {item.analyst ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {item.viewer ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : (
                      <XCircle className="h-4 w-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
