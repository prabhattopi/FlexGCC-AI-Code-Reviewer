import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { parseGitDiff } from "./tools/diffParser.js";
import { checkSyntaxAndStructure } from "./tools/syntaxChecker.js";
import { scanSecurityPatterns } from "./tools/securityScanner.js";
import { analyzeTestGaps } from "./tools/testGapAnalyzer.js";
import {
  StructuredReviewFeedback,
  StructuredReviewFeedbackSchema,
  ToolExecutionSignal,
} from "./types.js";

dotenv.config();

export interface ReviewOptions {
  diffText: string;
  prUrl?: string;
  customInstructions?: string;
}

export class CodeReviewAgent {
  private genAI: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    this.modelName = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";

    if (apiKey && apiKey !== "your_gemini_api_key_here") {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Main Agent Execution Pipeline
   */
  public async reviewCodeChange(options: ReviewOptions): Promise<StructuredReviewFeedback> {
    const { diffText, prUrl, customInstructions } = options;

    if (!diffText || diffText.trim().length === 0) {
      throw new Error("Git diff is empty. Please provide a valid code change diff.");
    }

    // Phase 1: Tool Calling & Static Inspection Pipeline
    const parsedDiff = parseGitDiff(diffText);
    const syntaxAnalysis = checkSyntaxAndStructure(parsedDiff.files);
    const securityAnalysis = scanSecurityPatterns(parsedDiff.files);
    const testGapAnalysis = analyzeTestGaps(parsedDiff.files);

    const toolSignals: ToolExecutionSignal[] = [
      syntaxAnalysis.signal,
      securityAnalysis.signal,
      testGapAnalysis.signal,
    ];

    // Phase 2: Agent Reasoning & LLM Synthesis
    if (!this.genAI) {
      console.warn("[CodeReviewAgent] GEMINI_API_KEY not configured. Returning deterministic static tool evaluation.");
      return this.generateDeterministicFallback(parsedDiff, toolSignals);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1, // Near deterministic for rigorous code audit
        },
      });

      const systemPrompt = `You are DiffSensei, an autonomous Principal AI Code Review Agent.
Your mission is to perform an uncompromising, deep technical code review on a git diff or pull request.
You must return structured, actionable feedback covering:
1. BUGS: Concrete logical bugs, off-by-one errors, null/undefined pointers, unhandled promise rejections, race conditions, memory leaks.
2. RISKS: Security flaws (SQL injection, XSS, token leakage), breaking API changes, performance bottlenecks, concurrency hazards.
3. MISSING TESTS: Critical test scenarios, edge cases, boundary conditions, or unhandled exceptions that lack unit/integration coverage.
4. STYLE ISSUES: Idiomatic naming, readability, dead code, leftover debug statements, adherence to clean architecture.

You are provided with pre-computed tool inspection signals (syntax check, security scanner, and test coverage gap analysis). Cross-examine and synthesize these tool signals alongside your deep semantic code analysis.

CRITICAL INSTRUCTIONS:
- Format response strictly as JSON matching the schema below.
- Do not output markdown code blocks or conversational text, output ONLY valid raw JSON.
- Provide clear line numbers and concrete suggested code fixes for every identified bug.
- If severe bugs or security flaws exist, verdict MUST be 'REQUEST_CHANGES'. If only minor or style items, verdict can be 'COMMENT' or 'APPROVE'.`;

      const promptPayload = `
PULL REQUEST / DIFF CONTEXT:
${prUrl ? `PR URL: ${prUrl}` : "Input: Direct Git Diff"}
Files Changed: ${parsedDiff.files.length}
Additions: +${parsedDiff.totalAdditions}
Deletions: -${parsedDiff.totalDeletions}

PRE-COMPUTED AGENT TOOL SIGNALS:
- Tool [SyntaxChecker]: ${JSON.stringify(syntaxAnalysis.signal.details)}
- Tool [SecurityScanner]: ${JSON.stringify(securityAnalysis.signal.details)}
- Tool [TestGapAnalyzer]: ${JSON.stringify(testGapAnalysis.signal.details)}

${customInstructions ? `USER INSTRUCTIONS: ${customInstructions}\n` : ""}

RAW GIT DIFF CONTENT:
\`\`\`diff
${diffText.slice(0, 30000)} ${diffText.length > 30000 ? "\n...[Diff truncated for token limits]..." : ""}
\`\`\`

JSON OUTPUT FORMAT REQUIRED:
{
  "summary": {
    "verdict": "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
    "score": number between 0 and 100,
    "overview": "Concise high-level executive summary of this code change and overall code health",
    "filesAnalyzedCount": number,
    "additionsCount": number,
    "deletionsCount": number
  },
  "bugs": [
    {
      "id": "BUG-1",
      "file": "path/to/file",
      "line": 42,
      "severity": "CRITICAL" | "MAJOR" | "MINOR" | "INFO",
      "title": "Short title",
      "explanation": "Detailed explanation of why this is a bug",
      "suggestedFix": "// Fixed code snippet"
    }
  ],
  "risks": [
    {
      "id": "RISK-1",
      "file": "path/to/file",
      "riskType": "SECURITY" | "PERFORMANCE" | "BREAKING_CHANGE" | "CONCURRENCY" | "DATA_INTEGRITY",
      "severity": "CRITICAL" | "MAJOR" | "MINOR" | "INFO",
      "title": "Short risk title",
      "impact": "What can break or be exploited",
      "mitigation": "Recommended architecture or code guardrail"
    }
  ],
  "missingTests": [
    {
      "id": "TEST-1",
      "targetFile": "path/to/file",
      "featureOrFunction": "functionName",
      "scenario": "Edge case description that must be tested",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "suggestedAssertion": "expect(...).to..."
    }
  ],
  "styleIssues": [
    {
      "id": "STYLE-1",
      "file": "path/to/file",
      "line": 15,
      "issue": "Description of style violation or anti-pattern",
      "recommendation": "How to improve readability/convention",
      "convention": "e.g., Clean Code / ESLint / PEP8"
    }
  ]
}
`;

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: promptPayload },
      ]);

      const responseText = result.response.text();
      const cleanedJson = this.sanitizeJsonResponse(responseText);
      const parsedData = JSON.parse(cleanedJson);

      // Attach tool signals to the response
      parsedData.toolSignals = toolSignals;

      // Validate through Zod
      const validated = StructuredReviewFeedbackSchema.parse(parsedData);
      return validated;
    } catch (err: any) {
      console.error("[CodeReviewAgent] Gemini API invocation error, falling back to deterministic inspection:", err?.message || err);
      const fallback = this.generateDeterministicFallback(parsedDiff, toolSignals);
      fallback.summary.overview = `(Analyzed with Deterministic Agent Tools: ${err?.message || "Model timeout"})`;
      return fallback;
    }
  }

  /**
   * Sanitizes markdown artifacts (like ```json ... ```) from LLM output.
   */
  private sanitizeJsonResponse(raw: string): string {
    let clean = raw.trim();
    if (clean.startsWith("```json")) {
      clean = clean.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (clean.startsWith("```")) {
      clean = clean.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return clean.trim();
  }

  /**
   * Deterministic Static Fallback when offline or in simulation mode
   */
  private generateDeterministicFallback(
    parsedDiff: ReturnType<typeof parseGitDiff>,
    toolSignals: ToolExecutionSignal[]
  ): StructuredReviewFeedback {
    const bugs: StructuredReviewFeedback["bugs"] = [];
    const risks: StructuredReviewFeedback["risks"] = [];
    const missingTests: StructuredReviewFeedback["missingTests"] = [];
    const styleIssues: StructuredReviewFeedback["styleIssues"] = [];

    // Map security findings to risks
    const secSignal = toolSignals.find((s) => s.toolName === "SecurityScanner");
    if (secSignal && secSignal.details) {
      secSignal.details.forEach((f: any, idx: number) => {
        risks.push({
          id: `RISK-SEC-${idx + 1}`,
          file: f.file,
          riskType: "SECURITY",
          severity: f.severity,
          title: f.description,
          impact: `Vulnerability identified in line ${f.line}: ${f.snippet}`,
          mitigation: "Sanitize user inputs, avoid raw interpolation, or move credentials to environment variables.",
        });
      });
    }

    // Map syntax/structure findings to bugs & style
    const synSignal = toolSignals.find((s) => s.toolName === "SyntaxChecker");
    if (synSignal && synSignal.details) {
      synSignal.details.forEach((f: any, idx: number) => {
        if (f.issue.includes("Assignment inside if") || f.issue.includes("Async void")) {
          bugs.push({
            id: `BUG-SYN-${idx + 1}`,
            file: f.file,
            line: f.line,
            severity: "MAJOR",
            title: f.issue,
            explanation: `Suspicious syntax pattern detected in added code: ${f.snippet || ""}`,
            suggestedFix: "Review conditional assignment or replace `async void` with `async Task`.",
          });
        } else {
          styleIssues.push({
            id: `STYLE-SYN-${idx + 1}`,
            file: f.file,
            line: f.line,
            issue: f.issue,
            recommendation: "Remove debug statements before pushing to production.",
            convention: "Production Readiness",
          });
        }
      });
    }

    // Map test gaps to missing tests
    const testSignal = toolSignals.find((s) => s.toolName === "TestGapAnalyzer");
    if (testSignal && testSignal.details?.gaps) {
      testSignal.details.gaps.forEach((g: any, idx: number) => {
        missingTests.push({
          id: `TEST-GAP-${idx + 1}`,
          targetFile: g.file,
          featureOrFunction: g.identifiedFunction || "New logic",
          scenario: g.reason,
          priority: g.priority,
          suggestedAssertion: `assert(testCoverageFor('${g.identifiedFunction || "feature"}')).toBeDefined()`,
        });
      });
    }

    const hasCritical = risks.some((r) => r.severity === "CRITICAL") || bugs.some((b) => b.severity === "CRITICAL");
    const verdict = hasCritical ? "REQUEST_CHANGES" : bugs.length > 0 ? "COMMENT" : "APPROVE";
    const score = hasCritical ? 35 : bugs.length > 0 ? 65 : 90;

    return {
      summary: {
        verdict,
        score,
        overview: `Static Agent Inspection completed across ${parsedDiff.files.length} changed file(s). Found ${bugs.length} bug(s), ${risks.length} risk(s), and ${missingTests.length} test gap(s).`,
        filesAnalyzedCount: parsedDiff.files.length,
        additionsCount: parsedDiff.totalAdditions,
        deletionsCount: parsedDiff.totalDeletions,
      },
      bugs,
      risks,
      missingTests,
      styleIssues,
      toolSignals,
    };
  }
}
