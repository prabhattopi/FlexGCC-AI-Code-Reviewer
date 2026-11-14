export interface BugItem {
  id: string;
  file: string;
  line?: number;
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  title: string;
  explanation: string;
  suggestedFix?: string;
}

export interface RiskItem {
  id: string;
  file: string;
  riskType: "SECURITY" | "PERFORMANCE" | "BREAKING_CHANGE" | "CONCURRENCY" | "DATA_INTEGRITY";
  severity: "CRITICAL" | "MAJOR" | "MINOR" | "INFO";
  title: string;
  impact: string;
  mitigation: string;
}

export interface MissingTestItem {
  id: string;
  targetFile: string;
  featureOrFunction: string;
  scenario: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  suggestedAssertion?: string;
}

export interface StyleIssue {
  id: string;
  file: string;
  line?: number;
  issue: string;
  recommendation: string;
  convention: string;
}

export interface ToolExecutionSignal {
  toolName: string;
  status: "SUCCESS" | "WARNING" | "FAILED";
  summary: string;
  findingsCount: number;
  details?: any;
}

export interface StructuredReviewFeedback {
  summary: {
    verdict: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
    score: number;
    overview: string;
    filesAnalyzedCount: number;
    additionsCount: number;
    deletionsCount: number;
  };
  bugs: BugItem[];
  risks: RiskItem[];
  missingTests: MissingTestItem[];
  styleIssues: StyleIssue[];
  toolSignals?: ToolExecutionSignal[];
}

export interface SampleDiff {
  id: string;
  name: string;
  language: string;
  description: string;
  diff: string;
}
