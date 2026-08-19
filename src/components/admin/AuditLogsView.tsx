import React, { useEffect, useState } from 'react';
import { History, Search, Download, RefreshCw, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';
import { formatDateTime } from '../../lib/utils';

export function AuditLogsView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error loading audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = logs.filter(
    l =>
      l.user_email.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.resource.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase())
  );

  const exportAuditCSV = () => {
    const headers = ['ID', 'Timestamp', 'UserEmail', 'Role', 'Action', 'Resource', 'IP', 'Status', 'Details'];
    const rows = filtered.map(l => [
      l.id,
      l.timestamp,
      l.user_email,
      l.user_role,
      l.action,
      `"${l.resource.replace(/"/g, '""')}"`,
      l.ip_address,
      l.status,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_audit_trail_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <History className="h-6 w-6 text-cyan-400" />
            SOC COMPLIANCE & SECURITY AUDIT TRAIL
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable record of all analyst queries, containment triggers, and policy modifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportAuditCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Trail</span>
          </button>
          <button
            onClick={loadAuditLogs}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, analyst email, IP, or resource..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <span className="text-xs font-mono text-slate-400">{filtered.length} Audit Records</span>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Analyst / Actor</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Action Executed</th>
                <th className="px-4 py-3">Resource Target</th>
                <th className="px-4 py-3">Origin IP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-mono">
                    No audit records match the query.
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">{log.user_email}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-cyan-400">{log.user_role}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-200">{log.action}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{log.resource}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{log.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400">
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-xs">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
