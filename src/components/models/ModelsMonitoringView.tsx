import React, { useEffect, useState } from 'react';
import { Cpu, Activity, CheckCircle2, TrendingUp, BarChart2, Zap, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../../lib/api';
import { ModelMetric } from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function ModelsMonitoringView() {
  const [models, setModels] = useState<ModelMetric[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelMetric | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    setIsLoading(true);
    try {
      const data = await api.getModels();
      setModels(data);
      if (data.length > 0) setSelectedModel(data[0]);
    } catch (err) {
      console.error('Error loading models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const rocData = [
    { fpr: 0.0, tpr: 0.0 },
    { fpr: 0.02, tpr: 0.78 },
    { fpr: 0.05, tpr: 0.91 },
    { fpr: 0.1, tpr: 0.96 },
    { fpr: 0.2, tpr: 0.98 },
    { fpr: 0.5, tpr: 0.99 },
    { fpr: 1.0, tpr: 1.0 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Cpu className="h-6 w-6 text-cyan-400" />
            ML MODEL REGISTRY & PERFORMANCE MONITOR
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time tracking of Isolation Forest, Random Forest threat classifier, and risk regression models.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-lg px-3 py-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Inference Latency: 3.8ms</span>
        </div>
      </div>

      {/* Model Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {models.map(m => {
          const isSelected = selectedModel?.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedModel(m)}
              className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                isSelected
                  ? 'border-cyan-500/60 bg-gradient-to-br from-slate-900 to-cyan-950/40 shadow-lg'
                  : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{m.type.replace('_', ' ')}</span>
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-800/60">
                  {m.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white mt-2">{m.name}</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Version {m.version}</p>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-800 pt-3 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">F1-Score</span>
                  <p className="text-sm font-bold text-white">{(m.f1_score * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">ROC-AUC</span>
                  <p className="text-sm font-bold text-cyan-400">{(m.roc_auc * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase">Latency</span>
                  <p className="text-sm font-bold text-emerald-400">{m.inference_latency_ms}ms</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep Dive on Selected Model */}
      {selectedModel && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Confusion Matrix & Metrics */}
          <div className="lg:col-span-6 space-y-6">
            {/* Confusion Matrix */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Confusion Matrix (Validation Split)</h3>
                <span className="text-xs font-mono text-slate-400">
                  Dataset: {selectedModel.training_dataset_size.toLocaleString()} records
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                {/* True Positive */}
                <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/30 p-4 text-center">
                  <span className="text-[11px] text-emerald-400 font-semibold block">TRUE POSITIVE (TP)</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedModel.confusion_matrix.true_positive.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Threats accurately blocked</span>
                </div>

                {/* False Positive */}
                <div className="rounded-xl border border-amber-900/60 bg-amber-950/30 p-4 text-center">
                  <span className="text-[11px] text-amber-400 font-semibold block">FALSE POSITIVE (FP)</span>
                  <p className="text-2xl font-bold text-amber-300 mt-1">
                    {selectedModel.confusion_matrix.false_positive.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Normal marked anomalous (0.4%)</span>
                </div>

                {/* False Negative */}
                <div className="rounded-xl border border-rose-900/60 bg-rose-950/30 p-4 text-center">
                  <span className="text-[11px] text-rose-400 font-semibold block">FALSE NEGATIVE (FN)</span>
                  <p className="text-2xl font-bold text-rose-300 mt-1">
                    {selectedModel.confusion_matrix.false_negative.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Missed intrusions (0.2%)</span>
                </div>

                {/* True Negative */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                  <span className="text-[11px] text-slate-400 font-semibold block">TRUE NEGATIVE (TN)</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {selectedModel.confusion_matrix.true_negative.toLocaleString()}
                  </p>
                  <span className="text-[10px] text-slate-400">Normal traffic allowed</span>
                </div>
              </div>
            </div>

            {/* Model Drift & Health */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-3 font-mono text-xs">
              <h3 className="text-sm font-semibold text-white font-sans">Model Drift & Calibration</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Concept Drift Probability:</span>
                  <span className="text-emerald-400 font-bold">1.4% (Nominal)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Feature Distribution Drift:</span>
                  <span className="text-emerald-400 font-bold">0.8% (Stable)</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-400">Last Trained Checkpoint:</span>
                  <span className="text-slate-200">{new Date(selectedModel.last_trained_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Feature Importance Chart (SHAP-style) */}
          <div className="lg:col-span-6 rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Global Feature Importance (Gini / SHAP)</h3>
              <p className="text-xs text-slate-400">
                Top telemetry dimensions driving anomaly scoring in {selectedModel.name}
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedModel.feature_importance}
                  layout="vertical"
                  margin={{ left: 40, right: 20, top: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" stroke="#64748b" fontSize={11} domain={[0, 0.4]} />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="importance" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                    {selectedModel.feature_importance.map((entry, index) => (
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
        </div>
      )}
    </div>
  );
}
