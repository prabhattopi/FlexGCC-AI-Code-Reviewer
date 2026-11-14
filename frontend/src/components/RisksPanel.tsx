import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { RiskItem } from '../types';

interface RisksPanelProps {
  risks: RiskItem[];
}

export const RisksPanel: React.FC<RisksPanelProps> = ({ risks }) => {
  if (risks.length === 0) {
    return <div className="text-xs text-gray-500 italic p-6 text-center">No critical security or architecture risks flagged.</div>;
  }

  return (
    <div className="space-y-3.5">
      {risks.map((risk) => (
        <div key={risk.id} className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                {risk.riskType}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                {risk.severity}
              </span>
              <h5 className="text-xs font-bold text-white">{risk.title}</h5>
            </div>
            <span className="text-[11px] font-mono text-gray-400">{risk.file}</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <p>
              <span className="text-gray-400 font-semibold">Impact: </span>
              <span className="text-gray-200">{risk.impact}</span>
            </p>
            <p>
              <span className="text-emerald-400 font-semibold">Mitigation: </span>
              <span className="text-gray-200">{risk.mitigation}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
