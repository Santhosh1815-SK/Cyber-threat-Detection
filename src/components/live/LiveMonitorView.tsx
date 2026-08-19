import React, { useState } from 'react';
import {
  Radio,
  Play,
  Pause,
  Zap,
  Activity,
  ShieldAlert,
  ShieldCheck,
  Globe2,
  Trash2,
  Terminal,
  Cpu,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { formatDateTime } from '../../lib/utils';

export function LiveMonitorView() {
  const {
    isConnected,
    liveEvents,
    latestAlert,
    isSimulating,
    simulationInterval,
    toggleSimulation,
    setSimulationSpeed,
    triggerAttackSimulation,
    clearLiveEvents,
  } = useSocket();

  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-3 w-3">
              <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className={`relative inline-flex h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            </div>
            <h1 className="text-xl font-bold text-white font-mono">
              LIVE SOC RADAR & TELEMETRY STREAM
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time packet inspection and anomaly classification pipeline via Server-Sent Events (SSE).
          </p>
        </div>

        {/* Live Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-mono">
            <span className="text-slate-400">Stream Generator:</span>
            <button
              onClick={toggleSimulation}
              className={`flex items-center gap-1 font-bold ${isSimulating ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {isSimulating ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              <span>{isSimulating ? 'ACTIVE' : 'PAUSED'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs font-mono">
            <span className="text-[10px] text-slate-500 px-1">Rate:</span>
            {[1000, 2500, 5000].map(ms => (
              <button
                key={ms}
                onClick={() => setSimulationSpeed(ms)}
                className={`rounded px-2 py-0.5 text-[11px] ${
                  simulationInterval === ms
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>

          <button
            onClick={clearLiveEvents}
            title="Clear Live Feed"
            className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Stream Area: Radar Scanner (Left) + Real-Time Telemetry Feed (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Radar Visualizer & Injection Matrix */}
        <div className="lg:col-span-5 space-y-6">
          {/* Animated Radar Box */}
          <div className="relative flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-8 shadow-inner overflow-hidden min-h-[340px]">
            {/* Concentric Circles */}
            <div className="absolute h-64 w-64 rounded-full border border-cyan-500/20" />
            <div className="absolute h-48 w-48 rounded-full border border-cyan-500/30" />
            <div className="absolute h-32 w-32 rounded-full border border-cyan-500/40" />
            <div className="absolute h-16 w-16 rounded-full border border-cyan-500/50" />

            {/* Crosshairs */}
            <div className="absolute h-72 w-px bg-cyan-500/20" />
            <div className="absolute w-72 h-px bg-cyan-500/20" />

            {/* Rotating Radar Sweep Needle */}
            <div
              className={`absolute h-72 w-72 rounded-full ${
                isSimulating ? 'animate-spin' : ''
              }`}
              style={{
                animationDuration: '4s',
                background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6, 182, 212, 0.4) 360deg)',
              }}
            />

            {/* Radar Center Centerpiece */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 border border-cyan-500/60 shadow-lg shadow-cyan-500/30">
                <Radio className="h-6 w-6 text-cyan-400 animate-pulse" />
              </div>
              <span className="mt-3 font-mono text-xs font-bold text-cyan-300">SENTINEL RADAR</span>
              <span className="text-[10px] font-mono text-slate-500">Continuous Spectrum Ingestion</span>
            </div>

            {/* Random Threat Blips */}
            <div className="absolute top-16 left-20 h-2.5 w-2.5 rounded-full bg-rose-500 animate-ping" />
            <div className="absolute top-16 left-20 h-2 w-2 rounded-full bg-rose-500" />

            <div className="absolute bottom-20 right-24 h-2 w-2 rounded-full bg-amber-400" />
            <div className="absolute top-28 right-16 h-2 w-2 rounded-full bg-cyan-400" />
          </div>

          {/* Quick Attack Simulator Panel */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3 shadow-md">
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" />
              On-Demand Threat Injection Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Inject synthetic attack patterns to evaluate ML classification and alert generation in real-time.
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={() => triggerAttackSimulation('BRUTE_FORCE')}
                className="flex items-center justify-between rounded-xl border border-rose-800/60 bg-rose-950/40 p-3 text-xs text-rose-300 hover:bg-rose-900/50 transition-colors"
              >
                <span>SSH Brute Force</span>
                <span className="text-[10px] font-mono text-rose-400">22/TCP</span>
              </button>

              <button
                onClick={() => triggerAttackSimulation('PORT_SCAN')}
                className="flex items-center justify-between rounded-xl border border-orange-800/60 bg-orange-950/40 p-3 text-xs text-orange-300 hover:bg-orange-900/50 transition-colors"
              >
                <span>Nmap Port Sweep</span>
                <span className="text-[10px] font-mono text-orange-400">SYN</span>
              </button>

              <button
                onClick={() => triggerAttackSimulation('DATA_EXFILTRATION')}
                className="flex items-center justify-between rounded-xl border border-pink-800/60 bg-pink-950/40 p-3 text-xs text-pink-300 hover:bg-pink-900/50 transition-colors"
              >
                <span>Large Data Exfil</span>
                <span className="text-[10px] font-mono text-pink-400">54 MB</span>
              </button>

              <button
                onClick={() => triggerAttackSimulation('DDOS_BURST')}
                className="flex items-center justify-between rounded-xl border border-amber-800/60 bg-amber-950/40 p-3 text-xs text-amber-300 hover:bg-amber-900/50 transition-colors"
              >
                <span>HTTP Flood (DDoS)</span>
                <span className="text-[10px] font-mono text-amber-400">80/HTTP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Event Stream Terminal */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl flex flex-col h-[650px] overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-bold text-white font-mono">
                TELEMETRY EVENT STREAM ({liveEvents.length})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Protocol: TCP / HTTPS / SSH / DNS
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs divide-y divide-slate-900">
            {liveEvents.length === 0 ? (
              <div className="py-24 text-center text-slate-500">
                <Radio className="h-8 w-8 mx-auto text-slate-700 animate-pulse mb-2" />
                <p>Waiting for incoming packet telemetry...</p>
                <p className="text-[10px] mt-1 text-slate-600">Ensure Stream Generator is active.</p>
              </div>
            ) : (
              liveEvents.map(evt => (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`pt-2 cursor-pointer rounded-lg p-2 transition-colors ${
                    evt.is_threat
                      ? 'bg-rose-950/30 border border-rose-900/50 hover:bg-rose-900/40'
                      : 'hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      <span className={evt.is_threat ? 'text-rose-400 font-bold' : 'text-cyan-400 font-semibold'}>
                        {evt.id}
                      </span>
                      <span className="rounded bg-slate-900 px-1.5 py-0.2 text-[10px] text-slate-400">
                        {evt.protocol}:{evt.destination_port}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {evt.is_threat ? (
                        <span className="rounded bg-rose-950 px-1.5 py-0.5 text-[10px] font-bold text-rose-400 border border-rose-800/60">
                          THREAT FLAGGED ({evt.threat_category})
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400">NORMAL</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-slate-400 text-[11px]">
                    <span>
                      {evt.source_ip} → <span className="text-slate-300">{evt.destination_ip}</span> ({evt.device_id})
                    </span>
                    <span>
                      Bytes: {evt.bytes_sent} | Risk: <span className={evt.risk_score > 50 ? 'text-rose-400 font-bold' : 'text-slate-400'}>{evt.risk_score}</span>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
