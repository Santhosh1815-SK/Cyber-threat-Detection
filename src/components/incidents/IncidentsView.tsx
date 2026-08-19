import React, { useEffect, useState } from 'react';
import {
  Flame,
  Plus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Incident, Alert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { formatTimeAgo, formatDateTime } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface IncidentsViewProps {
  onSelectAlert: (alertId: string) => void;
}

export function IncidentsView({ onSelectAlert }: IncidentsViewProps) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [availableAlerts, setAvailableAlerts] = useState<Alert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // New incident form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('HIGH');
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [incData, alertData] = await Promise.all([
        api.getIncidents(),
        api.getAlerts({ status: 'ALL' }),
      ]);
      setIncidents(incData);
      setAvailableAlerts(alertData);
      if (incData.length > 0 && !selectedIncident) {
        setSelectedIncident(incData[0]);
      }
    } catch (err) {
      console.error('Error loading incidents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || selectedAlertIds.length === 0) return;

    try {
      const newInc = await api.createIncident({
        title,
        description,
        severity,
        alert_ids: selectedAlertIds,
        assigned_analyst: user?.name || 'Marcus Thorne',
      });
      setIncidents(prev => [newInc, ...prev]);
      setSelectedIncident(newInc);
      setIsCreating(false);
      setTitle('');
      setDescription('');
      setSelectedAlertIds([]);
    } catch (err: any) {
      alert(`Failed to create incident: ${err.message}`);
    }
  };

  const handleUpdateContainment = async (field: 'ip_blocked' | 'host_isolated' | 'firewall_rule_applied') => {
    if (!selectedIncident) return;
    const currentStatus = selectedIncident.containment_status[field];
    const updatedStatus = {
      ...selectedIncident.containment_status,
      [field]: !currentStatus,
    };

    try {
      const updated = await api.updateIncident(selectedIncident.id, {
        containment_status: updatedStatus,
        status: updatedStatus.ip_blocked && updatedStatus.host_isolated ? 'CONTAINED' : 'INVESTIGATING',
      });
      setSelectedIncident(updated);
      setIncidents(prev => prev.map(i => (i.id === updated.id ? updated : i)));
    } catch (err: any) {
      console.error('Error updating containment:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-400" />
            INCIDENT RESPONSE & CORRELATION
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Correlated multi-alert campaigns, containment tracking, and automated response playbooks.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Incident</span>
          </button>
          <button
            onClick={loadData}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Incidents List (Left) + Active Incident Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Active Security Cases ({incidents.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {incidents.map(inc => {
              const isSelected = selectedIncident?.id === inc.id;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    isSelected
                      ? 'border-cyan-500/60 bg-gradient-to-br from-slate-900 to-cyan-950/30 shadow-md'
                      : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-cyan-400">{inc.id}</span>
                      <SeverityBadge severity={inc.severity} />
                    </div>
                    <StatusBadge status={inc.status} />
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 mt-2">{inc.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description}</p>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers className="h-3 w-3 text-cyan-400" />
                      <span>{inc.alert_ids.length} Alerts Linked</span>
                    </span>
                    <span>Risk: {inc.risk_score}/100</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Incident Deep Dive */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 space-y-6 shadow-xl">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-lg font-bold text-cyan-400">{selectedIncident.id}</span>
                    <SeverityBadge severity={selectedIncident.severity} />
                    <StatusBadge status={selectedIncident.status} />
                  </div>
                  <h2 className="text-base font-bold text-white mt-1">{selectedIncident.title}</h2>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>Lead: {selectedIncident.assigned_analyst}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>Opened: {formatDateTime(selectedIncident.created_at)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Composite Risk</span>
                  <span className="text-2xl font-bold font-mono text-rose-400">
                    {selectedIncident.risk_score} / 100
                  </span>
                </div>
              </div>

              {/* AI Correlation Summary */}
              <div className="rounded-xl border border-indigo-900/40 bg-indigo-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                    AI Cross-Alert Correlation & Root Cause
                  </h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedIncident.ai_summary}
                </p>
              </div>

              {/* Containment Checklist & Status */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Containment & Mitigation Workflow
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleUpdateContainment('ip_blocked')}
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs transition-colors ${
                      selectedIncident.containment_status.ip_blocked
                        ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>IP Perimeter Drop</span>
                    <CheckCircle2 className={`h-4 w-4 ${selectedIncident.containment_status.ip_blocked ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>

                  <button
                    onClick={() => handleUpdateContainment('host_isolated')}
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs transition-colors ${
                      selectedIncident.containment_status.host_isolated
                        ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>VLAN Host Isolation</span>
                    <CheckCircle2 className={`h-4 w-4 ${selectedIncident.containment_status.host_isolated ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>

                  <button
                    onClick={() => handleUpdateContainment('firewall_rule_applied')}
                    className={`flex items-center justify-between rounded-lg border p-3 text-xs transition-colors ${
                      selectedIncident.containment_status.firewall_rule_applied
                        ? 'border-emerald-800/60 bg-emerald-950/30 text-emerald-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>Firewall Rule Enforced</span>
                    <CheckCircle2 className={`h-4 w-4 ${selectedIncident.containment_status.firewall_rule_applied ? 'text-emerald-400' : 'text-slate-600'}`} />
                  </button>
                </div>
              </div>

              {/* Linked Alerts List */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Linked Threat Alerts ({selectedIncident.alert_ids.length})
                </h4>
                <div className="space-y-2">
                  {selectedIncident.alert_ids.map(alertId => {
                    const alertObj = availableAlerts.find(a => a.id === alertId);
                    return (
                      <div
                        key={alertId}
                        className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-cyan-400">{alertId}</span>
                          <span className="text-slate-200">{alertObj?.title || 'Security Anomaly'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {alertObj && <SeverityBadge severity={alertObj.severity} />}
                          <button
                            onClick={() => onSelectAlert(alertId)}
                            className="rounded bg-slate-800 hover:bg-cyan-600 hover:text-white px-2 py-1 text-[11px] font-mono text-cyan-300 transition-colors"
                          >
                            Inspect →
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next Action Playbook Recommendations */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  NIST SP 800-61 Incident Recommendations
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {selectedIncident.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-mono text-cyan-400 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-slate-500 font-mono text-xs">
              Select an incident from the left pane to view active response triage.
            </div>
          )}
        </div>
      </div>

      {/* New Incident Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-400" />
                CREATE SECURITY INCIDENT CASE
              </h3>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateIncident} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Incident Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Coordinated SSH Password Spray & Host Exfil"
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Severity</label>
                <select
                  value={severity}
                  onChange={e => setSeverity(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Summarize the threat campaign vector..."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Correlate Alerts ({selectedAlertIds.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800 bg-slate-900 p-2 space-y-1.5">
                  {availableAlerts.map(alt => (
                    <label
                      key={alt.id}
                      className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAlertIds.includes(alt.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedAlertIds(prev => [...prev, alt.id]);
                          } else {
                            setSelectedAlertIds(prev => prev.filter(id => id !== alt.id));
                          }
                        }}
                        className="rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-0"
                      />
                      <span className="font-mono text-cyan-400 font-bold">{alt.id}</span>
                      <span className="truncate">{alt.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title || selectedAlertIds.length === 0}
                  className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                >
                  Create Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
