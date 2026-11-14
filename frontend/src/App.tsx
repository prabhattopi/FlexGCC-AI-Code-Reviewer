import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TelemetryBar } from './components/TelemetryBar';
import { DiffInputCard } from './components/DiffInputCard';
import { ExecutiveSummary } from './components/ExecutiveSummary';
import { BugsPanel } from './components/BugsPanel';
import { RisksPanel } from './components/RisksPanel';
import { TestsPanel } from './components/TestsPanel';
import { StylePanel } from './components/StylePanel';
import { StructuredReviewFeedback, SampleDiff } from './types';
import { Bug, ShieldAlert, TestTube, Palette, Search } from 'lucide-react';

export const App: React.FC = () => {
  const [samples, setSamples] = useState<SampleDiff[]>([]);
  const [diffText, setDiffText] = useState<string>('');
  const [prUrl, setPrUrl] = useState<string>('');
  const [customInstructions, setCustomInstructions] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle');
  const [feedback, setFeedback] = useState<StructuredReviewFeedback | null>(null);
  const [durationMs, setDurationMs] = useState<number | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'bugs' | 'risks' | 'tests' | 'style'>('bugs');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch preset sample diffs from Fastify backend
  useEffect(() => {
    fetch('/api/sample-diffs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.samples) {
          setSamples(data.samples);
        }
      })
      .catch((err) => console.warn('Could not load samples:', err));
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSelectSample = (sampleId: string) => {
    const s = samples.find((x) => x.id === sampleId);
    if (s) {
      setDiffText(s.diff);
      setPrUrl('');
      showToast(`Loaded ${s.name}`);
    }
  };

  const handleRunReview = async () => {
    if (!diffText.trim() && !prUrl.trim()) {
      showToast('Please provide a git diff or select a preset sample first');
      return;
    }

    setIsLoading(true);
    setStatus('running');

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diffText, prUrl, customInstructions }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Failed to complete review');
      }

      setFeedback(json.data);
      setDurationMs(json.durationMs);
      setStatus('completed');
      setActiveTab(json.data.bugs.length > 0 ? 'bugs' : 'risks');
      showToast('Code review completed successfully!');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      alert('Review failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!feedback) return;
    const { summary, bugs, risks, missingTests, styleIssues } = feedback;
    const md = `# DiffSensei Code Review Report

**Verdict:** \`${summary.verdict}\` | **Score:** ${summary.score}/100
**Files Analyzed:** ${summary.filesAnalyzedCount} (+${summary.additionsCount} / -${summary.deletionsCount})

## Executive Summary
${summary.overview}

## 1. Possible Bugs (${bugs.length})
${bugs.map((b) => `### [${b.severity}] ${b.title}\n- **Location:** \`${b.file}${b.line ? `:${b.line}` : ''}\`\n- **Explanation:** ${b.explanation}\n${b.suggestedFix ? `\`\`\`\n${b.suggestedFix}\n\`\`\`\n` : ''}`).join('\n')}

## 2. Risks & Security (${risks.length})
${risks.map((r) => `### [${r.riskType} - ${r.severity}] ${r.title}\n- **File:** \`${r.file}\`\n- **Impact:** ${r.impact}\n- **Mitigation:** ${r.mitigation}\n`).join('\n')}

## 3. Missing Tests (${missingTests.length})
${missingTests.map((t) => `### [Priority: ${t.priority}] ${t.featureOrFunction}\n- **File:** \`${t.targetFile}\`\n- **Scenario:** ${t.scenario}\n${t.suggestedAssertion ? `- **Assertion:** \`${t.suggestedAssertion}\`\n` : ''}`).join('\n')}

## 4. Style Issues (${styleIssues.length})
${styleIssues.map((s) => `- \`${s.file}${s.line ? `:${s.line}` : ''}\` [${s.convention}]: ${s.issue}\n  *Recommendation:* ${s.recommendation}`).join('\n')}
`;
    navigator.clipboard.writeText(md);
    showToast('Markdown report copied to clipboard!');
  };

  const handleDownloadJson = () => {
    if (!feedback) return;
    const blob = new Blob([JSON.stringify(feedback, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DiffSensei-Review-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded JSON report');
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <DiffInputCard
            samples={samples}
            diffText={diffText}
            setDiffText={setDiffText}
            prUrl={prUrl}
            setPrUrl={setPrUrl}
            customInstructions={customInstructions}
            setCustomInstructions={setCustomInstructions}
            onSelectSample={handleSelectSample}
            onSubmit={handleRunReview}
            isLoading={isLoading}
          />
        </div>

        {/* Right Column (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <TelemetryBar status={status} />

          {!feedback ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center flex-1 flex flex-col items-center justify-center shadow-sm">
              <div className="h-16 w-16 rounded-2xl bg-gray-800/80 border border-gray-700 flex items-center justify-center text-3xl mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-200 mb-1">No Code Change Analyzed Yet</h3>
              <p className="text-xs text-gray-400 max-w-md mb-6 leading-relaxed">
                Click any preset button on the left (Python, React 19, or C# / .NET) or paste your own git diff to run the multi-tool autonomous AI review agent.
              </p>
              <button
                onClick={() => {
                  handleSelectSample('python');
                }}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-blue-400 border border-blue-500/20 transition"
              >
                Load Python Sample Diff
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-4">
              <ExecutiveSummary
                data={feedback}
                durationMs={durationMs}
                onCopyMarkdown={handleCopyMarkdown}
                onDownloadJson={handleDownloadJson}
              />

              {/* Tabs Container */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl flex-1 flex flex-col shadow-sm overflow-hidden">
                {/* Navigation Bar */}
                <div className="flex border-b border-gray-800 bg-gray-800/30 px-4 text-xs font-semibold">
                  <button
                    onClick={() => setActiveTab('bugs')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
                      activeTab === 'bugs'
                        ? 'border-red-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Bug className="w-3.5 h-3.5 text-red-400" />
                    <span>Possible Bugs</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 font-bold">
                      {feedback.bugs.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('risks')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
                      activeTab === 'risks'
                        ? 'border-purple-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                    <span>Risks & Security</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-purple-500/20 text-purple-400 font-bold">
                      {feedback.risks.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
                      activeTab === 'tests'
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <TestTube className="w-3.5 h-3.5 text-blue-400" />
                    <span>Missing Tests</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-400 font-bold">
                      {feedback.missingTests.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('style')}
                    className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
                      activeTab === 'style'
                        ? 'border-gray-400 text-white'
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5 text-gray-400" />
                    <span>Style & Clean Code</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gray-700 text-gray-300 font-bold">
                      {feedback.styleIssues.length}
                    </span>
                  </button>
                </div>

                {/* Panel View */}
                <div className="p-5 flex-1 overflow-y-auto max-h-[500px]">
                  {activeTab === 'bugs' && (
                    <BugsPanel bugs={feedback.bugs} onCopySnippet={() => showToast('Code fix copied!')} />
                  )}
                  {activeTab === 'risks' && <RisksPanel risks={feedback.risks} />}
                  {activeTab === 'tests' && <TestsPanel tests={feedback.missingTests} />}
                  {activeTab === 'style' && <StylePanel styles={feedback.styleIssues} />}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-xs text-white shadow-2xl z-50 flex items-center gap-2 animate-bounce">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
