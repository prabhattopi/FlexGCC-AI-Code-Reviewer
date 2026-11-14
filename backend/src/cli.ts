#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CodeReviewAgent } from "./agent.js";
import { SAMPLE_DIFFS } from "./sampleDiffs.js";
import { StructuredReviewFeedback } from "./types.js";

dotenv.config();

const program = new Command();

program
  .name("diff-sensei")
  .description("Autonomous AI Agent for Code Review and Structured Feedback")
  .version("1.0.0")
  .option("-d, --diff <path>", "Path to git diff or patch file")
  .option("-s, --sample <id>", "Run review on sample diff: 'python', 'react', or 'dotnet'")
  .option("-p, --pr <url>", "GitHub Pull Request URL (e.g. https://github.com/owner/repo/pull/123)")
  .option("-i, --instructions <text>", "Custom instructions or priority focus for review")
  .option("-o, --json <path>", "Save output report as formatted JSON file")
  .option("-m, --markdown <path>", "Save output report as Markdown document")
  .action(async (options) => {
    let diffContent = "";

    // 1. Check if reading from stdin
    if (!options.diff && !options.sample && !options.pr && !process.stdin.isTTY) {
      diffContent = await readStdin();
    } else if (options.sample) {
      const sample = SAMPLE_DIFFS[options.sample.toLowerCase()];
      if (!sample) {
        console.error(`Error: Unknown sample '${options.sample}'. Available: python, react, dotnet`);
        process.exit(1);
      }
      console.log(`[DiffSensei CLI] Loaded sample: ${sample.name}`);
      diffContent = sample.diff;
    } else if (options.diff) {
      const resolvedPath = path.resolve(process.cwd(), options.diff);
      if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: File not found at '${resolvedPath}'`);
        process.exit(1);
      }
      diffContent = fs.readFileSync(resolvedPath, "utf-8");
    } else if (options.pr) {
      console.log(`[DiffSensei CLI] Fetching PR diff from ${options.pr}...`);
      const cleanUrl = options.pr.replace(/\/+$/, "");
      const diffUrl = cleanUrl.endsWith(".diff") ? cleanUrl : `${cleanUrl}.diff`;
      const res = await fetch(diffUrl, {
        headers: { "User-Agent": "DiffSensei-CLI" },
      });
      if (!res.ok) {
        console.error(`Failed to fetch PR diff: HTTP ${res.status} ${res.statusText}`);
        process.exit(1);
      }
      diffContent = await res.text();
    } else {
      program.help();
      return;
    }

    if (!diffContent.trim()) {
      console.error("Error: Diff is empty.");
      process.exit(1);
    }

    console.log(`[DiffSensei CLI] Starting agent code review...`);
    const agent = new CodeReviewAgent();

    const startTime = Date.now();
    try {
      const feedback = await agent.reviewCodeChange({
        diffText: diffContent,
        prUrl: options.pr,
        customInstructions: options.instructions,
      });
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      renderConsoleReport(feedback, duration);

      if (options.json) {
        const outPath = path.resolve(process.cwd(), options.json);
        fs.writeFileSync(outPath, JSON.stringify(feedback, null, 2), "utf-8");
        console.log(`\nSaved JSON report to: ${outPath}`);
      }

      if (options.markdown) {
        const mdReport = generateMarkdownReport(feedback);
        const outPath = path.resolve(process.cwd(), options.markdown);
        fs.writeFileSync(outPath, mdReport, "utf-8");
        console.log(`\nSaved Markdown report to: ${outPath}`);
      }
    } catch (err: any) {
      console.error("\nReview failed:", err.message || err);
      process.exit(1);
    }
  });

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
  });
}

function renderConsoleReport(feedback: StructuredReviewFeedback, duration: string) {
  const { summary, bugs, risks, missingTests, styleIssues, toolSignals } = feedback;

  const verdictBadge =
    summary.verdict === "APPROVE"
      ? "\x1b[32m✔ APPROVED\x1b[0m"
      : summary.verdict === "REQUEST_CHANGES"
      ? "\x1b[31m✖ CHANGES REQUESTED\x1b[0m"
      : "\x1b[33m💬 COMMENT\x1b[0m";

  console.log("\n================================================================================");
  console.log(`  DIFFSENSEI AI REVIEW REPORT  |  Verdict: ${verdictBadge}  |  Score: ${summary.score}/100`);
  console.log(`  Analysis completed in ${duration}s across ${summary.filesAnalyzedCount} file(s) (+${summary.additionsCount} / -${summary.deletionsCount})`);
  console.log("================================================================================\n");

  console.log(`\x1b[1mOVERVIEW:\x1b[0m\n${summary.overview}\n`);

  if (toolSignals && toolSignals.length > 0) {
    console.log("\x1b[1m--- AGENT TOOL SIGNALS ---\x1b[0m");
    for (const s of toolSignals) {
      const statusIcon = s.status === "SUCCESS" ? "\x1b[32m✔\x1b[0m" : "\x1b[33m⚠\x1b[0m";
      console.log(`  ${statusIcon} [${s.toolName}]: ${s.summary}`);
    }
    console.log("");
  }

  // 1. Bugs
  console.log(`\x1b[1m1. BUGS (${bugs.length})\x1b[0m`);
  if (bugs.length === 0) {
    console.log("  No logical bugs identified.");
  } else {
    for (const b of bugs) {
      const sevColor = b.severity === "CRITICAL" ? "\x1b[31m" : "\x1b[33m";
      console.log(`  ${sevColor}[${b.severity}]\x1b[0m \x1b[1m${b.title}\x1b[0m (${b.file}${b.line ? `:${b.line}` : ""})`);
      console.log(`    Explanation: ${b.explanation}`);
      if (b.suggestedFix) {
        console.log(`    Suggested Fix:\n      \x1b[36m${b.suggestedFix.replace(/\n/g, "\n      ")}\x1b[0m`);
      }
      console.log("");
    }
  }

  // 2. Risks
  console.log(`\x1b[1m2. RISKS & SECURITY (${risks.length})\x1b[0m`);
  if (risks.length === 0) {
    console.log("  No high risks flagged.");
  } else {
    for (const r of risks) {
      console.log(`  \x1b[35m[${r.riskType} - ${r.severity}]\x1b[0m \x1b[1m${r.title}\x1b[0m (${r.file})`);
      console.log(`    Impact: ${r.impact}`);
      console.log(`    Mitigation: ${r.mitigation}`);
      console.log("");
    }
  }

  // 3. Missing Tests
  console.log(`\x1b[1m3. MISSING TEST SCENARIOS (${missingTests.length})\x1b[0m`);
  if (missingTests.length === 0) {
    console.log("  No test coverage gaps identified.");
  } else {
    for (const t of missingTests) {
      console.log(`  \x1b[34m[Priority: ${t.priority}]\x1b[0m Target: \x1b[1m${t.targetFile}\x1b[0m -> ${t.featureOrFunction}`);
      console.log(`    Scenario: ${t.scenario}`);
      if (t.suggestedAssertion) {
        console.log(`    Recommended Assertion: ${t.suggestedAssertion}`);
      }
      console.log("");
    }
  }

  // 4. Style Issues
  console.log(`\x1b[1m4. STYLE & READABILITY ISSUES (${styleIssues.length})\x1b[0m`);
  if (styleIssues.length === 0) {
    console.log("  No style issues identified.");
  } else {
    for (const st of styleIssues) {
      console.log(`  • (${st.file}${st.line ? `:${st.line}` : ""}) [${st.convention}]: ${st.issue}`);
      console.log(`    Recommendation: ${st.recommendation}`);
    }
  }

  console.log("\n================================================================================\n");
}

function generateMarkdownReport(feedback: StructuredReviewFeedback): string {
  const { summary, bugs, risks, missingTests, styleIssues, toolSignals } = feedback;

  return `# DiffSensei Code Review Report

**Verdict:** \`${summary.verdict}\`  
**Quality Score:** ${summary.score} / 100  
**Files Analyzed:** ${summary.filesAnalyzedCount} (+${summary.additionsCount} / -${summary.deletionsCount})

---

## Executive Summary
${summary.overview}

---

## Agent Tool Signals
${
  toolSignals && toolSignals.length > 0
    ? toolSignals.map((s) => `- **${s.toolName}** [${s.status}]: ${s.summary}`).join("\n")
    : "_No tool signals recorded._"
}

---

## 1. Possible Bugs (${bugs.length})
${
  bugs.length === 0
    ? "_No bugs identified._"
    : bugs
        .map(
          (b) => `### [${b.severity}] ${b.title}
- **Location:** \`${b.file}${b.line ? `:${b.line}` : ""}\`
- **Explanation:** ${b.explanation}
${b.suggestedFix ? `\n\`\`\`\n${b.suggestedFix}\n\`\`\`` : ""}
`
        )
        .join("\n")
}

---

## 2. Risks & Security (${risks.length})
${
  risks.length === 0
    ? "_No critical risks identified._"
    : risks
        .map(
          (r) => `### [${r.riskType}] ${r.title}
- **File:** \`${r.file}\`
- **Severity:** \`${r.severity}\`
- **Impact:** ${r.impact}
- **Mitigation:** ${r.mitigation}
`
        )
        .join("\n")
}

---

## 3. Missing Tests (${missingTests.length})
${
  missingTests.length === 0
    ? "_No test coverage gaps identified._"
    : missingTests
        .map(
          (t) => `### [Priority: ${t.priority}] ${t.featureOrFunction}
- **Target File:** \`${t.targetFile}\`
- **Scenario:** ${t.scenario}
${t.suggestedAssertion ? `- **Suggested Assertion:** \`${t.suggestedAssertion}\`` : ""}
`
        )
        .join("\n")
}

---

## 4. Style Issues (${styleIssues.length})
${
  styleIssues.length === 0
    ? "_No style issues identified._"
    : styleIssues
        .map(
          (s) => `- **\`${s.file}${s.line ? `:${s.line}` : ""}\`** [${s.convention}]: ${s.issue}  
  *Recommendation:* ${s.recommendation}`
        )
        .join("\n")
}
`;
}

program.parse(process.argv);
