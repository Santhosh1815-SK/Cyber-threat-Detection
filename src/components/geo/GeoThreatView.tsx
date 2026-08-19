import React, { useState } from 'react';
import { Globe2, ShieldAlert, Navigation, Zap, AlertTriangle, ArrowRight } from 'lucide-react';
import { SeverityBadge } from '../common/SeverityBadge';

export function GeoThreatView() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  const threatLocations = [
    {
      country: 'Russian Federation',
      code: 'RU',
      city: 'Moscow',
      x: 620,
      y: 160,
      threatCount: 42,
      threatTypes: ['SSH Brute Force', 'Credential Stuffing'],
      severity: 'CRITICAL',
      ipSample: '185.190.140.42',
      riskScore: 92,
    },
    {
      country: 'China',
      code: 'CN',
      city: 'Shanghai',
      x: 740,
      y: 240,
      threatCount: 38,
      threatTypes: ['Data Exfiltration', 'SQL Injection'],
      severity: 'HIGH',
      ipSample: '203.0.113.88',
      riskScore: 89,
    },
    {
      country: 'Netherlands',
      code: 'NL',
      city: 'Amsterdam',
      x: 490,
      y: 175,
      threatCount: 29,
      threatTypes: ['Port Scan', 'SYN Sweep'],
      severity: 'MEDIUM',
      ipSample: '91.240.118.5',
      riskScore: 68,
    },
    {
      country: 'Brazil',
      code: 'BR',
      city: 'São Paulo',
      x: 320,
      y: 380,
      threatCount: 22,
      threatTypes: ['HTTP Flood (DDoS)'],
      severity: 'HIGH',
      ipSample: '194.26.29.11',
      riskScore: 78,
    },
    {
      country: 'Iran',
      code: 'IR',
      city: 'Tehran',
      x: 585,
      y: 225,
      threatCount: 17,
      threatTypes: ['Vulnerability Probe'],
      severity: 'MEDIUM',
      ipSample: '185.143.220.1',
      riskScore: 64,
    },
    {
      country: 'United States',
      code: 'US',
      city: 'Ashburn, VA',
      x: 230,
      y: 210,
      threatCount: 14,
      threatTypes: ['Compromised Cloud Worker'],
      severity: 'LOW',
      ipSample: '198.51.100.24',
      riskScore: 45,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Globe2 className="h-6 w-6 text-cyan-400" />
            GLOBAL GEOGRAPHIC THREAT INTELLIGENCE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geolocation mapping of adversarial IP origin vectors and attack trajectories.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>Active Origin Clusters: 6 Nations</span>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-4 lg:p-6 shadow-2xl overflow-hidden">
        {/* SVG World Map Background & Threat Nodes */}
        <div className="relative w-full aspect-[16/9] max-h-[500px] bg-slate-950/80 rounded-xl overflow-hidden border border-slate-900 flex items-center justify-center">
          {/* Subtle Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

          <svg
            viewBox="0 0 1000 500"
            className="w-full h-full text-slate-800"
            style={{ filter: 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.1))' }}
          >
            {/* Simplified World Continents Silhouettes */}
            {/* North America */}
            <path
              d="M150 110 Q220 90 280 130 Q270 190 220 230 Q170 200 130 160 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* South America */}
            <path
              d="M260 270 Q340 290 320 400 Q280 430 250 350 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Europe */}
            <path
              d="M460 120 Q540 110 540 180 Q470 190 450 150 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Africa */}
            <path
              d="M460 210 Q550 210 540 340 Q480 370 450 270 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Asia */}
            <path
              d="M560 100 Q800 100 800 240 Q650 260 560 180 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Australia */}
            <path
              d="M740 320 Q840 320 810 400 Q730 380 730 340 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1"
            />

            {/* Target SOC Data Center (e.g. Frankfurt / US-East) */}
            <circle cx="480" cy="160" r="6" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
            <text x="492" y="165" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="bold">
              SOC CORE
            </text>

            {/* Attack Vectors (Animated Arcs) */}
            {threatLocations.map((loc, idx) => (
              <g key={idx}>
                {/* Attack Curve */}
                <path
                  d={`M${loc.x} ${loc.y} Q${(loc.x + 480) / 2} ${(loc.y + 160) / 2 - 40} 480 160`}
                  fill="none"
                  stroke={loc.severity === 'CRITICAL' ? '#f43f5e' : '#fb923c'}
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                  opacity="0.7"
                />

                {/* Threat Node Marker */}
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r={loc.severity === 'CRITICAL' ? 12 : 8}
                  fill={loc.severity === 'CRITICAL' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(251, 146, 60, 0.25)'}
                  className="animate-ping"
                  style={{ animationDuration: '3s' }}
                />
                <circle
                  cx={loc.x}
                  cy={loc.y}
                  r="5"
                  fill={loc.severity === 'CRITICAL' ? '#f43f5e' : '#fb923c'}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  className="cursor-pointer hover:r-7 transition-all"
                  onClick={() => setSelectedLocation(loc)}
                />
                <text
                  x={loc.x + 8}
                  y={loc.y + 4}
                  fill="#e2e8f0"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {loc.code} ({loc.threatCount})
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* Selected Location Quick Detail Overlay */}
        {selectedLocation && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white">{selectedLocation.country}</span>
                <SeverityBadge severity={selectedLocation.severity as any} />
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Risk: {selectedLocation.riskScore}/100
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sample IP: <span className="font-mono text-slate-300">{selectedLocation.ipSample}</span> | Vectors:{' '}
                {selectedLocation.threatTypes.join(', ')}
              </p>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-xs font-mono text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Origin Country Threat Rankings Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-md">
        <h3 className="text-sm font-semibold text-white mb-4">Adversary Source Country Rankings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-2.5">Origin Country</th>
                <th className="pb-2.5">Flagged Events</th>
                <th className="pb-2.5">Primary Threat Vectors</th>
                <th className="pb-2.5">Representative IP</th>
                <th className="pb-2.5">Severity</th>
                <th className="pb-2.5 text-right">Risk Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {threatLocations.map(loc => (
                <tr key={loc.country} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 font-sans font-semibold text-slate-200">
                    {loc.country} ({loc.code})
                  </td>
                  <td className="py-3 text-cyan-400 font-bold">{loc.threatCount} attacks</td>
                  <td className="py-3 font-sans text-slate-300">{loc.threatTypes.join(', ')}</td>
                  <td className="py-3 text-slate-400">{loc.ipSample}</td>
                  <td className="py-3 font-sans">
                    <SeverityBadge severity={loc.severity as any} />
                  </td>
                  <td className="py-3 text-right font-bold text-rose-400">{loc.riskScore}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
