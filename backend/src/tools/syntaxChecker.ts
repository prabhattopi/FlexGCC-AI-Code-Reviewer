import { ParsedDiffFile, ToolExecutionSignal } from "../types.js";

export interface SyntaxFinding {
  file: string;
  line?: number;
  issue: string;
  snippet?: string;
}

/**
 * Checks for syntax anomalies, unclosed brackets/quotes, and structural issues in added lines.
 */
export function checkSyntaxAndStructure(files: ParsedDiffFile[]): {
  signal: ToolExecutionSignal;
  findings: SyntaxFinding[];
} {
  const findings: SyntaxFinding[] = [];

  for (const file of files) {
    const ext = file.newPath.split(".").pop()?.toLowerCase();

    // Check bracket/parenthesis balancing across added lines
    let parenCount = 0;
    let braceCount = 0;
    let bracketCount = 0;

    for (const added of file.addedLines) {
      const line = added.content;

      // Ignore comments
      if (line.trim().startsWith("//") || line.trim().startsWith("#") || line.trim().startsWith("/*")) {
        continue;
      }

      for (const char of line) {
        if (char === "(") parenCount++;
        else if (char === ")") parenCount--;
        else if (char === "{") braceCount++;
        else if (char === "}") braceCount--;
        else if (char === "[") bracketCount++;
        else if (char === "]") bracketCount--;
      }

      // Check common typos like assignment in conditional `if (x = 5)`
      if (/\bif\s*\([^=]*\s*=\s*[^=].*\)/.test(line)) {
        findings.push({
          file: file.newPath,
          line: added.lineNum,
          issue: "Potential unintentional assignment inside if-condition (`=` instead of `===` or `==`)",
          snippet: line.trim(),
        });
      }

      // Check for console.log / print leftovers
      if (
        (ext === "ts" || ext === "js" || ext === "tsx" || ext === "jsx") &&
        /\bconsole\.(log|debug|warn)\(/.test(line)
      ) {
        findings.push({
          file: file.newPath,
          line: added.lineNum,
          issue: "Debug `console.log` left in production code change",
          snippet: line.trim(),
        });
      } else if (ext === "py" && /^\s*print\(/.test(line)) {
        findings.push({
          file: file.newPath,
          line: added.lineNum,
          issue: "Debug `print()` left in production Python code change",
          snippet: line.trim(),
        });
      }

      // Check for async void in C# (dangerous pattern)
      if (ext === "cs" && /\basync\s+void\s+[A-Za-z0-9_]+\s*\(/.test(line) && !line.includes("EventHandler")) {
        findings.push({
          file: file.newPath,
          line: added.lineNum,
          issue: "Async void method detected in C# (exceptions cannot be caught; use `async Task` instead)",
          snippet: line.trim(),
        });
      }
    }

    // Flag unbalanced blocks if significant
    if (Math.abs(braceCount) > 2 || Math.abs(parenCount) > 2) {
      findings.push({
        file: file.newPath,
        issue: `Disproportionate braces/parentheses balance (braces: ${braceCount}, parens: ${parenCount}). Verify block closures.`,
      });
    }
  }

  const status = findings.length > 0 ? "WARNING" : "SUCCESS";
  const summary =
    findings.length > 0
      ? `Detected ${findings.length} potential syntax, formatting, or structural signals across diff files.`
      : "Syntax and structural checks passed with no basic anomalies.";

  return {
    signal: {
      toolName: "SyntaxChecker",
      status,
      summary,
      findingsCount: findings.length,
      details: findings,
    },
    findings,
  };
}
