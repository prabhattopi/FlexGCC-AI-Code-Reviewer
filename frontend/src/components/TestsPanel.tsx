import React from 'react';
import { TestTube2, AlertCircle } from 'lucide-react';
import { MissingTestItem } from '../types';

interface TestsPanelProps {
  tests: MissingTestItem[];
}

export const TestsPanel: React.FC<TestsPanelProps> = ({ tests }) => {
  if (tests.length === 0) {
    return <div className="text-xs text-gray-500 italic p-6 text-center">No missing test gaps identified.</div>;
  }

  return (
    <div className="space-y-3.5">
      {tests.map((test) => (
        <div key={test.id} className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  test.priority === 'HIGH'
                    ? 'bg-red-500/20 text-red-400 border-red-500/30'
                    : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}
              >
                PRIORITY: {test.priority}
              </span>
              <h5 className="text-xs font-bold text-white font-mono">{test.featureOrFunction}</h5>
            </div>
            <span className="text-[11px] font-mono text-gray-400">{test.targetFile}</span>
          </div>

          <p className="text-xs text-gray-300 mb-2">
            <span className="text-gray-400 font-semibold">Recommended Scenario: </span>
            {test.scenario}
          </p>

          {test.suggestedAssertion && (
            <div className="bg-[#0b0f17] border border-gray-800 rounded-lg p-2.5 text-[11px] font-mono text-blue-300">
              <span className="text-gray-500 select-none">// Suggested Assertion: </span>
              {test.suggestedAssertion}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
