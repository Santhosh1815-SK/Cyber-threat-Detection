import React, { useState } from 'react';
import {
  X,
  ShieldAlert,
  Flame,
  Bot,
  ExternalLink,
  Lock,
  Ban,
  UserX,
  Server,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Send,
  MessageSquare,
} from 'lucide-react';
import { Alert } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { StatusBadge } from '../common/StatusBadge';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/utils';

interface AlertDetailModalProps {
  alertId: string;
  onClose: () => void;
  onOpenCopilotWithContext: (alertId: string) => void;
}

export function AlertDetailModal({ alertId, onClose, onOpenCopilotWithContext }: AlertDetailModalProps) {
  const { user, role } = useAuth();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    loadAlert();
  }, [alertId]);

  const loadAlert = async () => {
    try {
      const data = await api.getAlertById(alertId);
      setAlert(data);
    } catch (err) {
      console.error('Error loading alert:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteContainment = async (actionName: string) => {
    try {
      const updated = await api.executeContainment(alertId, actionName);
      setAlert(updated);
      setActionSuccessMsg(`Executed containment: "${actionName}"`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Error executing containment: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (newStatus: any) => {
    try {
      const updated = await api.updateAlert(alertId, { status: newStatus });
      setAlert(updated);
    } catch (err: any) {
      console.error('Update status error:', err);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const updated = await api.addAlertNote(
        alertId,
        noteText,
        user?.name || 'Analyst',
        role
      );
      setAlert(updated);
      setNoteText('');
    } catch (err: any) {
      console.error('Error adding note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (!alert && isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">
          <Sparkles className="h-6 w-6 text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-xs font-mono">Loading Threat Telemetry...</p>
        </div>
      </div>
    );
  }

  if (!alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="my-8 w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-950/60 border border-rose-800/60">
              <ShieldAlert className="h-5 w-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-white">{alert.id}</span>
                <SeverityBadge severity={alert.severity} />
                <StatusBadge status={alert.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{alert.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCopilotWithContext(alert.id)}
              className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md hover:from-indigo-500 hover:to-cyan-500 transition-all"
            >
              <Bot className="h-4 w-4 text-cyan-200" />
              <span>Ask Copilot AI</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionSuccessMsg && (
            <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>{actionSuccessMsg}</span>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Composite Risk Score</span>
              <p className="text-xl font-bold font-mono text-rose-400 mt-1">{alert.risk_score} / 100</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">ML Confidence</span>
              <p className="text-xl font-bold font-mono text-cyan-400 mt-1">{(alert.confidence * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Adversary Source</span>
              <p className="text-sm font-bold font-mono text-slate-200 mt-1 truncate">{alert.source_ip}</p>
              <span className="text-[10px] text-slate-400">{alert.country}</span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase">Target Asset</span>
              <p className="text-sm font-bold font-mono text-slate-200 mt-1 truncate">{alert.affected_asset}</p>
              <span className="text-[10px] text-slate-400 font-mono">{alert.destination_ip}</span>
            </div>
          </div>

          {/* Explainable AI (XAI) Section */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Explainable AI (XAI) Detection Analysis
                </h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Model: Isolation Forest + Tree Ensemble</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              {alert.explanation.primary_factor}
            </p>

            {/* Contributing Feature Deviations */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 mb-2 block">
                Top Anomaly Feature Deviations (vs Baseline):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {alert.explanation.contributing_factors.map((factor, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="font-mono text-cyan-400">{factor.feature}</span>
                      <span className="text-[10px] font-mono text-rose-400 font-bold">
                        {factor.deviation_vs_baseline}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">{factor.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* MITRE ATT&CK Mapping */}
            {alert.explanation.mitre_technique && (
              <div className="flex items-center justify-between rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-300">
                    {alert.explanation.mitre_technique.id}
                  </span>
                  <span className="text-slate-200 font-semibold">{alert.explanation.mitre_technique.name}</span>
                  <span className="text-slate-400 text-[11px]">({alert.explanation.mitre_technique.tactic})</span>
                </div>
                <a
                  href={alert.explanation.mitre_technique.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:underline"
                >
                  <span>MITRE Matrix</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Containment & Active Response Actions */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Automated Defensive Containment Actions
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleExecuteContainment(`Block IP ${alert.source_ip}`)}
                className="flex items-center gap-1.5 rounded-lg border border-rose-800/60 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-900/60 transition-colors"
              >
                <Ban className="h-3.5 w-3.5" />
                <span>Drop & Block Source IP</span>
              </button>

              <button
                onClick={() => handleExecuteContainment(`Isolate Host ${alert.affected_asset}`)}
                className="flex items-center gap-1.5 rounded-lg border border-amber-800/60 bg-amber-950/40 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-900/60 transition-colors"
              >
                <Server className="h-3.5 w-3.5" />
                <span>Isolate Asset from VLAN</span>
              </button>

              <button
                onClick={() => handleExecuteContainment('Revoke Active User Tokens')}
                className="flex items-center gap-1.5 rounded-lg border border-purple-800/60 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/60 transition-colors"
              >
                <UserX className="h-3.5 w-3.5" />
                <span>Revoke Auth Credentials</span>
              </button>
            </div>

            {/* Executed actions log */}
            {alert.containment_actions_taken.length > 0 && (
              <div className="mt-2 text-xs">
                <span className="text-[11px] font-mono text-slate-400">Actions Executed on Host:</span>
                <ul className="mt-1 space-y-1">
                  {alert.containment_actions_taken.map((act, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Analyst Workflow Status Transition */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Update Status:</span>
              {(['NEW', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                    alert.status === st
                      ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Analyst Notes & Investigation Thread */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Analyst Investigation Notes ({alert.notes.length})
              </h4>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {alert.notes.length === 0 ? (
                <p className="text-xs text-slate-500">No notes posted yet.</p>
              ) : (
                alert.notes.map(note => (
                  <div key={note.id} className="rounded-lg bg-slate-950 p-2.5 border border-slate-800/80 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
                      <span className="font-semibold text-slate-200">
                        {note.author} ({note.role})
                      </span>
                      <span className="font-mono text-slate-500">{formatDateTime(note.timestamp)}</span>
                    </div>
                    <p className="text-slate-300 font-sans">{note.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
              <input
                type="text"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Add investigation findings, triage commentary, or IOC notes..."
                className="flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!noteText.trim() || isSubmittingNote}
                className="rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                <span>Post Note</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
