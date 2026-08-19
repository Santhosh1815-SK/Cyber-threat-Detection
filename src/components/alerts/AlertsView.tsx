import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  ArrowUpDown,
  Bot,
  ExternalLink,
  Download,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Alert, Severity, AlertStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { AlertDetailModal } from './AlertDetailModal';
import { formatTimeAgo } from '../../lib/utils';

interface AlertsViewProps {
  onOpenCopilotWithContext: (alertId: string) => void;
  selectedAlertId?: string | null;
  onClearSelectedAlert?: () => void;
}

export function AlertsView({ onOpenCopilotWithContext, selectedAlertId, onClearSelectedAlert }: AlertsViewProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [activeModalAlertId, setActiveModalAlertId] = useState<string | null>(selectedAlertId || null);

  useEffect(() => {
    if (selectedAlertId) {
      setActiveModalAlertId(selectedAlertId);
    }
  }, [selectedAlertId]);

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAlerts({
        severity: severityFilter,
        status: statusFilter,
        search,
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAlerts();
  };

  const exportAlertsCSV = () => {
    const headers = ['ID', 'Title', 'Severity', 'RiskScore', 'Confidence', 'SourceIP', 'TargetAsset', 'Status', 'Timestamp'];
    const rows = alerts.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      a.severity,
      a.risk_score,
      a.confidence,
      a.source_ip,
      a.affected_asset,
      a.status,
      a.timestamp,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sentinel_alerts_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-rose-400" />
            THREATS & ACTIVE ALERTS
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Correlated anomalies flagged by the Sentinel ML detection pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportAlertsCSV}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadAlerts}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by IP, alert ID, asset, or threat vector..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </form>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Severity:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Status:</span>
          {['ALL', 'NEW', 'INVESTIGATING', 'RESOLVED'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Threat & Target Asset</th>
                <th className="px-4 py-3">Adversary Source</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">ML Confidence</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Age</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    Loading threat intelligence...
                  </td>
                </tr>
              ) : alerts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    No active alerts match the filter criteria.
                  </td>
                </tr>
              ) : (
                alerts.map(alert => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-cyan-400">{alert.id}</td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-200">{alert.title}</p>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Asset: <span className="text-slate-300">{alert.affected_asset}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <span className="text-slate-200">{alert.source_ip}</span>
                      <span className="block text-[10px] text-slate-500">{alert.country}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400">{alert.risk_score}</span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-rose-500"
                            style={{ width: `${alert.risk_score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-cyan-400 font-semibold">
                      {(alert.confidence * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={alert.status} />
                    </td>
                    <td className="px-4 py-3.5 text-[11px] text-slate-400 font-mono">
                      {formatTimeAgo(alert.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveModalAlertId(alert.id)}
                          className="flex items-center gap-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white px-2.5 py-1 text-[11px] font-mono text-cyan-300 transition-colors"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Inspect</span>
                        </button>
                        <button
                          onClick={() => onOpenCopilotWithContext(alert.id)}
                          title="Ask Copilot AI"
                          className="rounded bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 p-1 text-indigo-300 transition-colors"
                        >
                          <Bot className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert Investigation Modal */}
      {activeModalAlertId && (
        <AlertDetailModal
          alertId={activeModalAlertId}
          onClose={() => {
            setActiveModalAlertId(null);
            onClearSelectedAlert?.();
            loadAlerts();
          }}
          onOpenCopilotWithContext={onOpenCopilotWithContext}
        />
      )}
    </div>
  );
}
