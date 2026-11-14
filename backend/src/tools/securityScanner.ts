import { ParsedDiffFile, ToolExecutionSignal } from "../types.js";

export interface SecurityFinding {
  file: string;
  line: number;
  category: "CREDENTIAL_LEAK" | "SQL_INJECTION" | "COMMAND_INJECTION" | "XSS" | "INSECURE_API";
  severity: "CRITICAL" | "MAJOR" | "MINOR";
  description: string;
  snippet: string;
}

const SECURITY_PATTERNS = [
  // 1. Hardcoded Credentials & API Keys
  {
    category: "CREDENTIAL_LEAK" as const,
    severity: "CRITICAL" as const,
    regex: /(?:AKIA[0-9A-Z]{16})|(?:ghp_[0-9a-zA-Z]{36})|(?:sk_live_[0-9a-zA-Z]{24})|(?:-----BEGIN (?:RSA )?PRIVATE KEY-----)/i,
    description: "Hardcoded secret, private key, or cloud provider API token detected",
  },
  {
    category: "CREDENTIAL_LEAK" as const,
    severity: "CRITICAL" as const,
    regex: /(?:password|secret|apiKey|api_key|authToken)\s*[:=]\s*["'][a-zA-Z0-9_\-!@#$%^&*]{8,}["']/i,
    description: "High-entropy hardcoded password or token in assignment",
  },

  // 2. SQL Injection Patterns
  {
    category: "SQL_INJECTION" as const,
    severity: "CRITICAL" as const,
    regex: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?\s+(?:WHERE|SET|VALUES)\s+.*?(\$\{.*?\}|f["'].*?\{.*?\}|["']\s*\+\s*[a-zA-Z0-9_]+)/i,
    description: "Raw string interpolation or concatenation in SQL query (SQL Injection risk)",
  },
  {
    category: "SQL_INJECTION" as const,
    severity: "CRITICAL" as const,
    regex: /(?:raw|query|execute)\s*\(\s*["']SELECT.*?["']\s*\+/i,
    description: "Direct SQL string concatenation without parameterized queries",
  },

  // 3. Command Injection & Dangerous Code Execution
  {
    category: "COMMAND_INJECTION" as const,
    severity: "CRITICAL" as const,
    regex: /\b(?:exec|eval|execSync)\s*\(\s*(?:req\.|params\.|body\.|query\.|input|\$)/i,
    description: "Untrusted input directly passed to eval() or shell execution function",
  },

  // 4. Cross-Site Scripting (XSS)
  {
    category: "XSS" as const,
    severity: "MAJOR" as const,
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/i,
    description: "Use of dangerouslySetInnerHTML in React without sanitization (XSS risk)",
  },
  {
    category: "XSS" as const,
    severity: "MAJOR" as const,
    regex: /\.innerHTML\s*=\s*(?!["']<\/?\w+>["'])[^;]+/i,
    description: "Direct DOM innerHTML assignment (XSS vulnerability risk)",
  },

  // 5. Insecure Crypto / Protocols
  {
    category: "INSECURE_API" as const,
    severity: "MAJOR" as const,
    regex: /crypto\.createHash\s*\(\s*["'](?:md5|sha1)["']\s*\)/i,
    description: "Use of cryptographically broken hash algorithm (MD5/SHA1)",
  },
];

/**
 * Scans added lines in the diff for known security anti-patterns.
 */
export function scanSecurityPatterns(files: ParsedDiffFile[]): {
  signal: ToolExecutionSignal;
  findings: SecurityFinding[];
} {
  const findings: SecurityFinding[] = [];

  for (const file of files) {
    for (const added of file.addedLines) {
      const line = added.content;

      // Ignore comment lines
      if (line.trim().startsWith("//") || line.trim().startsWith("#") || line.trim().startsWith("*")) {
        continue;
      }

      for (const pattern of SECURITY_PATTERNS) {
        if (pattern.regex.test(line)) {
          findings.push({
            file: file.newPath,
            line: added.lineNum,
            category: pattern.category,
            severity: pattern.severity,
            description: pattern.description,
            snippet: line.trim(),
          });
        }
      }
    }
  }

  const status = findings.length > 0 ? "WARNING" : "SUCCESS";
  const summary =
    findings.length > 0
      ? `Discovered ${findings.length} security concern(s) (including ${findings.filter((f) => f.severity === "CRITICAL").length} critical).`
      : "Zero hardcoded secrets, dangerous evals, or raw SQL interpolations detected.";

  return {
    signal: {
      toolName: "SecurityScanner",
      status,
      summary,
      findingsCount: findings.length,
      details: findings,
    },
    findings,
  };
}
