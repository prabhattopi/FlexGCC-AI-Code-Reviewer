import { z } from "zod";

// ==========================================
// Zod Schemas for Strict Structured Feedback
// ==========================================

export const SeveritySchema = z.enum(["CRITICAL", "MAJOR", "MINOR", "INFO"]);
export type Severity = z.infer<typeof SeveritySchema>;

export const ReviewVerdictSchema = z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]);
export type ReviewVerdict = z.infer<typeof ReviewVerdictSchema>;

export const BugItemSchema = z.object({
  id: z.string(),
  file: z.string(),
  line: z.number().optional(),
  severity: SeveritySchema,
  title: z.string(),
  explanation: z.string(),
  suggestedFix: z.string().optional(),
});
export type BugItem = z.infer<typeof BugItemSchema>;

export const RiskItemSchema = z.object({
  id: z.string(),
  file: z.string(),
  riskType: z.enum(["SECURITY", "PERFORMANCE", "BREAKING_CHANGE", "CONCURRENCY", "DATA_INTEGRITY"]),
  severity: SeveritySchema,
  title: z.string(),
  impact: z.string(),
  mitigation: z.string(),
});
export type RiskItem = z.infer<typeof RiskItemSchema>;

export const MissingTestItemSchema = z.object({
  id: z.string(),
  targetFile: z.string(),
  featureOrFunction: z.string(),
  scenario: z.string(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  suggestedAssertion: z.string().optional(),
});
export type MissingTestItem = z.infer<typeof MissingTestItemSchema>;

export const StyleIssueSchema = z.object({
  id: z.string(),
  file: z.string(),
  line: z.number().optional(),
  issue: z.string(),
  recommendation: z.string(),
  convention: z.string(),
});
export type StyleIssue = z.infer<typeof StyleIssueSchema>;

export const ToolExecutionSignalSchema = z.object({
  toolName: z.string(),
  status: z.enum(["SUCCESS", "WARNING", "FAILED"]),
  summary: z.string(),
  findingsCount: z.number(),
  details: z.any().optional(),
});
export type ToolExecutionSignal = z.infer<typeof ToolExecutionSignalSchema>;

export const StructuredReviewFeedbackSchema = z.object({
  summary: z.object({
    verdict: ReviewVerdictSchema,
    score: z.number().min(0).max(100), // 0 to 100 quality score
    overview: z.string(),
    filesAnalyzedCount: z.number(),
    additionsCount: z.number(),
    deletionsCount: z.number(),
  }),
  bugs: z.array(BugItemSchema),
  risks: z.array(RiskItemSchema),
  missingTests: z.array(MissingTestItemSchema),
  styleIssues: z.array(StyleIssueSchema),
  toolSignals: z.array(ToolExecutionSignalSchema).optional(),
});
export type StructuredReviewFeedback = z.infer<typeof StructuredReviewFeedbackSchema>;

// Parsed Diff Data Structures
export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: string[];
}

export interface ParsedDiffFile {
  oldPath: string;
  newPath: string;
  isNew: boolean;
  isDeleted: boolean;
  hunks: DiffHunk[];
  addedLines: { lineNum: number; content: string }[];
  deletedLines: { lineNum: number; content: string }[];
}

export interface ParsedDiff {
  files: ParsedDiffFile[];
  totalAdditions: number;
  totalDeletions: number;
}
