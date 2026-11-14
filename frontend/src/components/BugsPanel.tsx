import React from 'react';
import { Copy, Check } from 'lucide-react';
import { BugItem } from '../types';

interface BugsPanelProps {
  bugs: BugItem[];
  onCopySnippet: (text: string) => void;
}

export const BugsPanel: React.FC<BugsPanelProps> = ({ bugs, onCopySnippet }) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    onCopySnippet(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (bugs.length === 0) {
    return <div className="text-xs text-gray-500 italic p-6 text-center">No logical bugs flagged. Code passed bug analysis!</div>;
  }

  return (
    <div className="space-y-3.5">
      {bugs.map((bug) => (
        <div key={bug.id} className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  bug.severity === 'CRITICAL'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                {bug.severity}
              </span>
              <h5 className="text-xs font-bold text-white">{bug.title}</h5>
            </div>
            <span className="text-[11px] font-mono text-gray-400">
              {bug.file}
              {bug.line ? `:${bug.line}` : ''}
            </span>
          </div>

          <p className="text-xs text-gray-300 mb-2.5 leading-relaxed">{bug.explanation}</p>

          {bug.suggestedFix && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-1">
                <span>Suggested Code Fix:</span>
                <button
                  onClick={() => handleCopy(bug.id, bug.suggestedFix!)}
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
                >
                  {copiedId === bug.id ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Fix</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-[#0b0f17] border border-gray-800 rounded-lg p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                <code>{bug.suggestedFix}</code>
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
