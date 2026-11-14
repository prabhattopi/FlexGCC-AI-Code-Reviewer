import React from 'react';
import { Palette, Check } from 'lucide-react';
import { StyleIssue } from '../types';

interface StylePanelProps {
  styles: StyleIssue[];
}

export const StylePanel: React.FC<StylePanelProps> = ({ styles }) => {
  if (styles.length === 0) {
    return <div className="text-xs text-gray-500 italic p-6 text-center">No style violations found. Clean code!</div>;
  }

  return (
    <div className="space-y-3.5">
      {styles.map((item) => (
        <div
          key={item.id}
          className="bg-gray-800/80 border border-gray-700/80 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs shadow-sm"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-700 text-gray-300">
                {item.convention}
              </span>
              <span className="font-bold text-gray-200">{item.issue}</span>
            </div>
            <p className="text-gray-400">{item.recommendation}</p>
          </div>
          <span className="text-[11px] font-mono text-gray-500 whitespace-nowrap">
            {item.file}
            {item.line ? `:${item.line}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};
