import { ParsedDiffFile, ToolExecutionSignal } from "../types.js";

export interface TestGapFinding {
  file: string;
  identifiedFunction?: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

/**
 * Evaluates whether business logic changes are accompanied by matching test changes in the diff.
 */
export function analyzeTestGaps(files: ParsedDiffFile[]): {
  signal: ToolExecutionSignal;
  findings: TestGapFinding[];
  hasTestsInDiff: boolean;
} {
  const findings: TestGapFinding[] = [];

  const isTestFile = (path: string) =>
    /(?:test|spec|__tests__|Test|Tests)\.(?:ts|tsx|js|jsx|py|cs|go|java)$/i.test(path) ||
    /^(?:test_|tests\/)/i.test(path);

  const testFiles = files.filter((f) => isTestFile(f.newPath) || isTestFile(f.oldPath));
  const codeFiles = files.filter((f) => !isTestFile(f.newPath) && !f.isDeleted);
  const hasTestsInDiff = testFiles.length > 0;

  // Pattern for new exported functions or route definitions
  const functionRegex =
    /(?:export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)|def\s+([A-Za-z0-9_]+)\s*\(|(?:public|private|internal)\s+(?:async\s+)?[A-Za-z0-9_<>]+\s+([A-Za-z0-9_]+)\s*\(|router\.(?:get|post|put|delete|patch)\s*\(\s*["']([^"']+)["'])/;

  for (const file of codeFiles) {
    // Only analyze core application files
    if (file.newPath.endsWith(".json") || file.newPath.endsWith(".md") || file.newPath.endsWith(".css")) {
      continue;
    }

    const newFunctions: string[] = [];

    for (const added of file.addedLines) {
      const match = added.content.match(functionRegex);
      if (match) {
        const fnName = match[1] || match[2] || match[3] || `Route:${match[4]}`;
        if (!newFunctions.includes(fnName)) {
          newFunctions.push(fnName);
        }
      }
    }

    if (!hasTestsInDiff && file.addedLines.length > 5) {
      if (newFunctions.length > 0) {
        for (const fn of newFunctions) {
          findings.push({
            file: file.newPath,
            identifiedFunction: fn,
            reason: `New or modified function '${fn}' introduced without any corresponding test file updates in this pull request.`,
            priority: "HIGH",
          });
        }
      } else {
        findings.push({
          file: file.newPath,
          reason: `Significant logic changes (+${file.addedLines.length} lines) made, but no test files were added or modified in the diff.`,
          priority: "MEDIUM",
        });
      }
    }
  }

  const status = findings.length > 0 ? "WARNING" : "SUCCESS";
  const summary = hasTestsInDiff
    ? `Diff includes ${testFiles.length} test file(s).`
    : findings.length > 0
    ? `No test files found in PR diff; identified ${findings.length} feature/function test coverage gap(s).`
    : "No major test coverage gaps flagged.";

  return {
    signal: {
      toolName: "TestGapAnalyzer",
      status,
      summary,
      findingsCount: findings.length,
      details: { hasTestsInDiff, gaps: findings },
    },
    findings,
    hasTestsInDiff,
  };
}
