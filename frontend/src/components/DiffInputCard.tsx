import React, { useState } from 'react';
import { Play, Sparkles, RefreshCw, GitPullRequest, FileCode } from 'lucide-react';
import { SampleDiff } from '../types';

interface DiffInputCardProps {
  samples: SampleDiff[];
  diffText: string;
  setDiffText: (val: string) => void;
  prUrl: string;
  setPrUrl: (val: string) => void;
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
  onSelectSample: (sampleId: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const DiffInputCard: React.FC<DiffInputCardProps> = ({
  samples,
  diffText,
  setDiffText,
  prUrl,
  setPrUrl,
  customInstructions,
  setCustomInstructions,
  onSelectSample,
  onSubmit,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'diff' | 'pr'>('diff');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const handleSampleClick = (id: string) => {
    setSelectedSampleId(id);
    setActiveTab('diff');
    onSelectSample(id);
  };

  const handleClear = () => {
    setDiffText('');
    setPrUrl('');
    setSelectedSampleId(null);
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Preset Diffs Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Sample Test Case</span>
          </h2>
          <span className="text-[11px] text-blue-400 font-medium">1-Click Load</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Python */}
          <button
            onClick={() => handleSampleClick('python')}
            className={`text-left p-3 rounded-xl border transition ${
              selectedSampleId === 'python'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-400">Python</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                SQLi Bug
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium truncate">Auth Service</p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">SQL Injection, MD5, NoneType</p>
          </button>

          {/* React */}
          <button
            onClick={() => handleSampleClick('react')}
            className={`text-left p-3 rounded-xl border transition ${
              selectedSampleId === 'react'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-cyan-400">React 19</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold">
                Leak & XSS
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium truncate">Metric Widget</p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">setInterval leak, innerHTML</p>
          </button>

          {/* .NET */}
          <button
            onClick={() => handleSampleClick('dotnet')}
            className={`text-left p-3 rounded-xl border transition ${
              selectedSampleId === 'dotnet'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-800 bg-gray-900/60 hover:border-gray-700 hover:bg-gray-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-indigo-400">C# / .NET</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold">
                Async Void
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium truncate">Payment Processor</p>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">async void, NullRef, '=' bug</p>
          </button>
        </div>
      </div>

      {/* Main Input Form */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('diff')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'diff'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Git Diff / Patch</span>
            </button>
            <button
              onClick={() => setActiveTab('pr')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                activeTab === 'pr'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>GitHub PR URL</span>
            </button>
          </div>

          <button onClick={handleClear} className="text-xs text-gray-400 hover:text-gray-200">
            Clear
          </button>
        </div>

        {activeTab === 'pr' ? (
          <div className="mb-3">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              GitHub Pull Request URL
            </label>
            <input
              type="text"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              placeholder="https://github.com/owner/repo/pull/123"
              className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-[280px]">
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">
              Raw Git Diff Content (Paste or Load Preset)
            </label>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              placeholder="diff --git a/src/app.ts b/src/app.ts&#10;index 0000000..1234567 100644&#10;--- a/src/app.ts&#10;+++ b/src/app.ts&#10;@@ -1,5 +1,6 @@&#10;..."
              className="flex-1 w-full bg-[#0b0f17] border border-gray-700 rounded-xl p-3.5 text-xs text-gray-200 placeholder-gray-500 font-mono focus:outline-none focus:border-blue-500 resize-none leading-relaxed min-h-[240px]"
            />
          </div>
        )}

        {/* Custom Instructions */}
        <div className="mt-3">
          <input
            type="text"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Optional prompt instruction: e.g. 'Pay special attention to race conditions'"
            className="w-full bg-[#0b0f17] border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit Button */}
        <div className="mt-4">
          <button
            onClick={onSubmit}
            disabled={isLoading || (!diffText.trim() && !prUrl.trim())}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Agent Analyzing Code Change...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Autonomous AI Code Review</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
