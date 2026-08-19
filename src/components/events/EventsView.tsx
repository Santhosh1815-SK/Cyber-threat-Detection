import React, { useEffect, useState } from 'react';
import {
  ScrollText,
  Search,
  UploadCloud,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
} from 'lucide-react';
import { api } from '../../lib/api';
import { SecurityEvent } from '../../types';
import { formatDateTime, formatBytes } from '../../lib/utils';

export function EventsView() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState('ALL');
  const [threatOnly, setThreatOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Inspector Modal
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  // Upload Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadEvents();
  }, [page, eventType, threatOnly]);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const res = await api.getEvents({
        page,
        limit: 25,
        search,
        eventType,
        threatOnly,
      });
      if (res.success) {
        setEvents(res.data);
        setTotalCount(res.total);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadEvents();
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadText.trim()) return;

    setIsUploading(true);
    try {
      let parsedLogs: any[] = [];
      try {
        parsedLogs = JSON.parse(uploadText);
        if (!Array.isArray(parsedLogs)) parsedLogs = [parsedLogs];
      } catch {
        // Parse CSV lines
        const lines = uploadText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        parsedLogs = lines.slice(1).map(line => {
          const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = vals[i];
          });
          return obj;
        });
      }

      const res = await api.uploadLogs(parsedLogs, 'custom_security_feed.json');
      setUploadResult(res);
      loadEvents();
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const loadSampleDataset = () => {
    const sample = [
      {
        source_ip: '185.220.101.5',
        destination_ip: '10.0.1.50',
        destination_port: 22,
        protocol: 'SSH',
        bytes_sent: 8200,
        bytes_received: 940,
        duration_ms: 1200,
        request_count: 45,
        failed_login_count: 38,
        login_attempts: 38,
        user_id: 'admin',
        device_id: 'bastion-02',
        country: 'Germany',
        country_code: 'DE',
        event_type: 'BRUTE_FORCE',
        authentication_status: 'FAILED',
        user_agent: 'hydra/9.5 SSH-Bruter',
      },
      {
        source_ip: '10.0.2.88',
        destination_ip: '10.0.1.10',
        destination_port: 443,
        protocol: 'HTTPS',
        bytes_sent: 1400,
        bytes_received: 5200,
        duration_ms: 250,
        request_count: 2,
        failed_login_count: 0,
        login_attempts: 1,
        user_id: 'm.turner',
        device_id: 'laptop-finance-08',
        country: 'United States',
        country_code: 'US',
        event_type: 'NORMAL_TRAFFIC',
        authentication_status: 'SUCCESS',
      },
    ];
    setUploadText(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-cyan-400" />
            SECURITY EVENT LOGS & INGESTION
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Raw telemetry ingested across endpoints, firewalls, auth gateways, and proxy servers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setIsUploadOpen(true);
              setUploadResult(null);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition-colors"
          >
            <UploadCloud className="h-4 w-4" />
            <span>Upload Log Dataset</span>
          </button>
          <button
            onClick={loadEvents}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
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
            placeholder="Search IP, username, device ID, user agent, or payload..."
            className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
        </form>

        {/* Event Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Event Type:</span>
          {['ALL', 'NORMAL_TRAFFIC', 'BRUTE_FORCE', 'PORT_SCAN', 'DATA_EXFILTRATION', 'DDOS_BURST'].map(et => (
            <button
              key={et}
              onClick={() => {
                setEventType(et);
                setPage(1);
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-colors ${
                eventType === et
                  ? 'bg-cyan-950 border border-cyan-500/60 text-cyan-300'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {et.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Threats Only Checkbox */}
        <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={threatOnly}
            onChange={e => {
              setThreatOnly(e.target.checked);
              setPage(1);
            }}
            className="rounded border-slate-700 bg-slate-800 text-rose-500 focus:ring-0"
          />
          <span className="text-rose-400 font-semibold">Flagged Threats Only</span>
        </label>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px]">
                <th className="px-4 py-3">Event ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Source & Country</th>
                <th className="px-4 py-3">Destination & Port</th>
                <th className="px-4 py-3">Proto</th>
                <th className="px-4 py-3">Payload Size</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Anomaly Score</th>
                <th className="px-4 py-3 text-right">Raw Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    Loading security event stream...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-mono">
                    No security events found matching current query.
                  </td>
                </tr>
              ) : (
                events.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-cyan-400">{evt.id}</td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400">
                      {formatDateTime(evt.timestamp)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-slate-200">{evt.source_ip}</span>
                      <span className="block text-[10px] text-slate-500">{evt.country}</span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="text-slate-200">{evt.destination_ip}:{evt.destination_port}</span>
                      <span className="block text-[10px] text-slate-500">{evt.device_id}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">{evt.protocol}</td>
                    <td className="px-4 py-3 font-mono text-slate-300">{formatBytes(evt.bytes_sent)}</td>
                    <td className="px-4 py-3">
                      {evt.is_threat ? (
                        <span className="rounded bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 text-[10px] font-bold font-mono text-rose-400">
                          {evt.threat_category}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-mono text-[11px]">NORMAL</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">
                      <span className={evt.anomaly_score > 0.6 ? 'text-rose-400' : 'text-slate-400'}>
                        {(evt.anomaly_score * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="rounded bg-slate-800 hover:bg-cyan-600 hover:text-white px-2 py-1 text-[11px] font-mono text-cyan-300 transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 bg-slate-950/40 text-xs font-mono text-slate-400">
          <span>
            Showing {events.length} of {totalCount} events
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-200"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-cyan-400">Page {page}</span>
            <button
              disabled={events.length < 25}
              onClick={() => setPage(p => p + 1)}
              className="rounded border border-slate-800 bg-slate-900 px-2.5 py-1 disabled:opacity-40 hover:bg-slate-800 text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Raw Payload Inspector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  SECURITY EVENT TELEMETRY: {selectedEvent.id}
                </h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 max-h-96 overflow-y-auto font-mono text-xs text-cyan-300">
              <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Log Dataset Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UploadCloud className="h-5 w-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono">
                  INGEST CUSTOM SECURITY LOG DATASET
                </h3>
              </div>
              <button onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Paste JSON or CSV security log telemetry. The Isolation Forest and Risk Engine will automatically analyze, detect anomalies, and generate alerts.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Payload Editor:</span>
                <button
                  type="button"
                  onClick={loadSampleDataset}
                  className="text-xs font-mono text-cyan-400 hover:underline"
                >
                  Load Sample Dataset
                </button>
              </div>

              <textarea
                rows={10}
                required
                value={uploadText}
                onChange={e => setUploadText(e.target.value)}
                placeholder="[ { &quot;source_ip&quot;: &quot;185.190.140.10&quot;, &quot;destination_port&quot;: 22, ... } ]"
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 font-mono text-xs text-cyan-300 placeholder-slate-600 focus:border-cyan-500 focus:outline-none"
              />

              {uploadResult && (
                <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>
                    Successfully ingested {uploadResult.ingested_count} events ({uploadResult.threats_identified} threats flagged).
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadText.trim() || isUploading}
                  className="flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition-colors"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isUploading ? 'animate-spin' : ''}`} />
                  <span>{isUploading ? 'Analyzing...' : 'Ingest & Run ML Inference'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
