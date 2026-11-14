import React from 'react';
import { CheckCircle2, AlertTriangle, Disc, RefreshCw } from 'lucide-react';

interface TelemetryBarProps {
  status: 'idle' | 'running' | 'completed' | 'error';
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ status }) => {
  const steps = [
    { id: 'diff', name: 'DiffParser', desc: 'Hunk & line segmentation' },
    { id: 'syntax', name: 'SyntaxCheck', desc: 'AST & bracket sanity' },
    { id: 'security', name: 'SecurityScan', desc: 'SQLi, secrets, XSS' },
    { id: 'ai', name: 'GeminiSynthesis', desc: 'Structured Zod verification' },
  ];

  const getStatusLabel = () => {
    switch (status) {
      case 'running':
        return 'Status: Agent Inspecting Code & Calling Tools...';
      case 'completed':
        return 'Status: Audit Complete (Structured JSON Verified)';
      case 'error':
        return 'Status: Error executing review';
      default:
        return 'Status: Ready for Code Change';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Agent Reasoning & Multi-Tool Pipeline
        </h3>
        <span className="text-xs text-gray-400 font-mono flex items-center gap-1.5">
          {status === 'running' && <RefreshCw className="w-3 h-3 text-blue-400 animate-spin" />}
          {getStatusLabel()}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {steps.map((step, idx) => {
          const isDone = status === 'completed';
          const isCurrent = status === 'running';

          return (
            <div
              key={step.id}
              className={`p-2.5 rounded-xl border transition flex items-center space-x-2 ${
                isDone
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : isCurrent
                  ? 'border-blue-500/40 bg-blue-500/5'
                  : 'border-gray-800 bg-gray-900/60'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Disc className="w-4 h-4 text-blue-400 animate-pulse shrink-0" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-gray-700 flex items-center justify-center text-[10px] text-gray-500 shrink-0">
                  {idx + 1}
                </span>
              )}
              <div className="truncate">
                <p className="font-semibold text-gray-200">{step.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
