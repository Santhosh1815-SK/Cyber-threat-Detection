import React, { useState } from 'react';
import { Settings, Sliders, Shield, Bell, CheckCircle2, Save } from 'lucide-react';

export function SettingsView() {
  const [anomalyThreshold, setAnomalyThreshold] = useState(65);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [autoContainCritical, setAutoContainCritical] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <Settings className="h-6 w-6 text-cyan-400" />
          SOC PLATFORM CONFIGURATION & SENSITIVITY
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Tune ML anomaly detection thresholds, auto-containment playbooks, and notification triggers.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Platform settings & ML thresholds updated successfully.</span>
          </div>
        )}

        {/* Anomaly Detection Sensitivity */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Isolation Forest Anomaly Sensitivity</h3>
          </div>
          <p className="text-xs text-slate-400">
            Controls the threshold at which unsupervised outlier scores trigger alert generation. Lower scores increase detection coverage of zero-day attacks but may slightly raise false positives.
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Detection Trigger Score:</span>
              <span className="text-cyan-400 font-bold">{anomalyThreshold}%</span>
            </div>
            <input
              type="range"
              min={30}
              max={95}
              value={anomalyThreshold}
              onChange={e => setAnomalyThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>More Aggressive (30%)</span>
              <span>Balanced (65%)</span>
              <span>Strictly Conservative (95%)</span>
            </div>
          </div>
        </div>

        {/* Risk Score Alarm Threshold */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-rose-400" />
            <h3 className="text-sm font-semibold text-white">Critical Severity Risk Cutoff</h3>
          </div>
          <p className="text-xs text-slate-400">
            Alerts with composite risk scores equal to or exceeding this number are flagged as **CRITICAL**.
          </p>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Critical Alarm Cutoff:</span>
              <span className="text-rose-400 font-bold">{riskThreshold}/100</span>
            </div>
            <input
              type="range"
              min={50}
              max={90}
              value={riskThreshold}
              onChange={e => setRiskThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* Automated Containment Policy */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md space-y-4">
          <h3 className="text-sm font-semibold text-white">Automated Defense Execution</h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoContainCritical}
                onChange={e => setAutoContainCritical(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-0"
              />
              <div>
                <span className="text-slate-200 font-semibold block">Auto-Block High Confidence Anomaly IPs</span>
                <span className="text-slate-400 text-[11px]">
                  Automatically deploy perimeter drop firewall rules for alerts with ML confidence &gt; 95%.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={e => setEmailAlerts(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-cyan-600 focus:ring-0"
              />
              <div>
                <span className="text-slate-200 font-semibold block">Instant PagerDuty / Webhook Dispatch</span>
                <span className="text-slate-400 text-[11px]">
                  Send high-priority alerts to on-call Tier-3 SOC engineers via webhook.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-colors"
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
