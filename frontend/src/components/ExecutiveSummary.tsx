import React from 'react';
import { Copy, Download, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { StructuredReviewFeedback } from '../types';

interface ExecutiveSummaryProps {
  data: StructuredReviewFeedback;
  durationMs?: number;
  onCopyMarkdown: () => void;
  onDownloadJson: () => void;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  data,
  durationMs,
  onCopyMarkdown,
  onDownloadJson,
}) => {
  const { summary } = data;

  const getVerdictDetails = () => {
    switch (summary.verdict) {
      case 'APPROVE':
        return {
          label: '✔ APPROVED',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,
        };
      case 'REQUEST_CHANGES':
        return {
          label: '✖ CHANGES REQUESTED',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <XCircle className="w-4 h-4 text-rose-400" />,
        };
      default:
        return {
          label: '💬 COMMENT',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <MessageSquare className="w-4 h-4 text-amber-400" />,
        };
    }
  };

  const verdict = getVerdictDetails();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-800">
        <div className="flex items-center space-x-3.5">
          <span
            className={`text-xs font-extrabold uppercase px-3 py-1.5 rounded-xl border flex items-center gap-1.5 tracking-wider ${verdict.badgeClass}`}
          >
            {verdict.icon}
            <span>{verdict.label}</span>
          </span>

          <div>
            <span className="text-[11px] text-gray-400 block font-medium">Quality Score</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-black text-white">{summary.score}</span>
              <span className="text-xs text-gray-400">/ 100</span>
            </div>
          </div>
        </div>

        {/* Metrics & Actions */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-300 font-mono px-3 py-1.5 rounded-xl bg-gray-800/80 border border-gray-700">
            <span>
              {summary.filesAnalyzedCount} File{summary.filesAnalyzedCount > 1 ? 's' : ''}
            </span>
            <span className="text-gray-600">&bull;</span>
            <span className="text-emerald-400">+{summary.additionsCount}</span>
            <span className="text-rose-400">-{summary.deletionsCount}</span>
            {durationMs && (
              <>
                <span className="text-gray-600">&bull;</span>
                <span className="text-blue-400">{(durationMs / 1000).toFixed(1)}s</span>
              </>
            )}
          </div>

          <button
            onClick={onCopyMarkdown}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition"
            title="Copy Full Markdown Report"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={onDownloadJson}
            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition"
            title="Download JSON Report"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-3.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
          Executive Summary
        </h4>
        <p className="text-xs text-gray-300 leading-relaxed">{summary.overview}</p>
      </div>
    </div>
  );
};
