# ⚡ DiffSensei: Autonomous AI Code Review Agent

> **FlexGCC AI Engineer Practical Exercise**  
> **Candidate:** Prabhat Ranjan Singh (`topi9864@gmail.com` | [GitHub](https://github.com/prabhattopi) | [LinkedIn](https://www.linkedin.com/in/prabhat-ranjan-singh-71296721b/))  
> **Tech Stack:** Node.js, TypeScript, Fastify, Google Gemini Flash (`@google/generative-ai`), Zod, Tailwind CSS

---

## 1. What It Does

**DiffSensei** is an autonomous AI agent that ingests a code change (a Git diff, `.patch` file, or live GitHub Pull Request URL) and returns **strict structured engineering feedback**:

* 🐛 **Possible Bugs:** Detects runtime exceptions, null-pointer dereferences, off-by-one errors, and unhandled promise/async anti-patterns—accompanied by exact file/line citations and copyable code fixes.
* ⚠️ **Risks & Security:** Evaluates security vulnerabilities (SQL injection, XSS, token leakage), breaking API changes, data integrity concerns, and concurrency hazards with concrete mitigation steps.
* 🧪 **Missing Tests:** Analyzes business logic additions vs PR test coverage to flag uncovered edge cases, boundary conditions, and provides copyable test assertions.
* 🎨 **Style & Clean Code:** Surfaces naming conventions, dead code, leftover debug statements, and architecture violations.
* 📊 **Quality Score & Verdict:** Issues an automated decision (`APPROVED`, `REQUEST_CHANGES`, `COMMENT`) alongside an overall code health score (0–100).

The system operates across both an **interactive Web UI Dashboard** and a **standalone CLI runner** (`pnpm review`).

---

## 2. How It Was Built

```
                  ┌──────────────────────────────────────────────┐
                  │    INPUT: Git Diff / Patch / GitHub PR URL   │
                  └──────────────────────┬───────────────────────┘
                                         ▼
         ┌───────────────────────────────────────────────────────────────┐
         │             PHASE 1: DETERMINISTIC AGENT TOOLS                │
         │  • diffParser         -> Hunk parsing & +/- line index        │
         │  • syntaxChecker      -> Brackets balance & AST sanity        │
         │  • securityScanner    -> RegEx/AST patterns for SQLi, secrets │
         │  • testGapAnalyzer    -> Core logic vs PR test coverage       │
         └──────────────────────┬────────────────────────────────────────┘
                                │ Pre-computed Tool Signals
                                ▼
         ┌───────────────────────────────────────────────────────────────┐
         │          PHASE 2: LLM REASONING & SYNTHESIS (GEMINI)          │
         │  • Model: Google Gemini Flash via @google/generative-ai       │
         │  • Config: responseMimeType: 'application/json', temp: 0.1    │
         │  • Schema Enforcement: Zod validation on incoming JSON payload│
         └──────────────────────┬────────────────────────────────────────┘
                                ▼
         ┌───────────────────────────────────────────────────────────────┐
         │              OUTPUT: STRICT STRUCTURED FEEDBACK               │
         │  • Web Dashboard (Live Telemetry, Cards, Markdown Export)     │
         │  • CLI Runner (ANSI Colors, Markdown / JSON Report Exporters) │
         └───────────────────────────────────────────────────────────────┘
```

* **Core Framework:** **Fastify + TypeScript** for ultra-low latency REST endpoints (`POST /api/review`, `GET /api/sample-diffs`, `GET /api/health`) and static single-page app serving.
* **LLM & Reasoning:** **Google Gemini Flash** (`gemini-2.0-flash` / `gemini-2.5-flash`), configured with `responseMimeType: "application/json"` and `temperature: 0.1` for near-deterministic code analysis.
* **Tool Calling Mechanism:** 
  1. `diffParser`: Deconstructs unified diffs into structured file objects, change hunks, and line maps.
  2. `syntaxChecker`: Inspects unbalanced syntax structures, conditional assignments (`if (x = 0)`), and language anti-patterns (`async void`).
  3. `securityScanner`: Deterministically scans for hardcoded tokens, SQL string concatenations, dangerous evals, and unescaped HTML.
  4. `testGapAnalyzer`: Compares modified functions against the diff to flag missing test suites before hitting the LLM.
  The pre-computed signals are injected directly into the agent's prompt context, allowing the LLM to cross-examine static findings with semantic reasoning.
* **Schema Validation:** Strict **Zod schemas** validate the agent's output at runtime. A built-in sanitizer ensures malformed markdown code fences do not disrupt JSON parsing.
* **Deterministic Fallback Engine:** If the external LLM is unreachable or offline, the agent gracefully degrades to a deterministic rule-based evaluation engine without crashing.

---

## 3. What Went Wrong and How I Handled It

1. **LLM Output Formatting & Markdown Code Blocks:**  
   * *Problem:* Despite prompting for raw JSON, LLMs frequently wrap responses in markdown fences (\`\`\`json ... \`\`\`), which causes standard `JSON.parse()` to throw runtime syntax errors.  
   * *Solution:* Implemented `sanitizeJsonResponse()` to strip leading/trailing code blocks and whitespace, followed by Zod schema parsing with automated fallback.
2. **Missing Test False Positives on Minor Changes:**  
   * *Problem:* Early versions of `testGapAnalyzer` flagged every documentation or configuration file change (e.g. `.md`, `.json`, `.css`) as a "critical missing test gap".  
   * *Solution:* Added file extension filters and minimum additions thresholds so test gap signals only trigger when core business logic files (`.ts`, `.py`, `.cs`, `.js`) contain significant structural modifications.
3. **Sandbox Network & Offline Resilience:**  
   * *Problem:* In restricted sandbox environments where outbound network calls to `generativelanguage.googleapis.com` are blocked, unhandled fetch failures would crash the service.  
   * *Solution:* Built `generateDeterministicFallback()` inside the agent. If the Gemini API call encounters network drops or rate limits, the agent immediately constructs a structured review report directly from the deterministic tool signals (`SyntaxChecker`, `SecurityScanner`, `TestGapAnalyzer`).

---

## 4. What I Would Do Next

1. **GitHub Action & Webhook CI/CD Bot:** Package the agent into a zero-config GitHub Action that automatically posts inline line-by-line review comments on Pull Requests.
2. **Repository Context Retrieval (RAG / AST Graph):** Rather than reviewing the diff in isolation, use tree-sitter or LSP indexing to fetch the full definition of imported types, functions, and database schemas from the parent repository.
3. **Automated Fix PR Branch Creation:** Add a 1-click button on the Web UI that automatically branches, commits the suggested bug fixes, and pushes a patch PR back to GitHub.
4. **Fine-Tuned Specialized Mini-Models:** Train a smaller, quantized model (e.g. Qwen 2.5 Coder 7B or DeepSeek-Coder) for lightning-fast on-premise static diff triage before escalating complex changes to Gemini.

---

## 🚀 Quickstart Guide

### Prerequisites
* Node.js &ge; 20
* pnpm (`npm install -g pnpm`)
* Google Gemini API Key ([Get free key here](https://aistudio.google.com/))

### 1. Installation
```bash
git clone <your-repo-url>
cd FlexGCC-AI-Code-Reviewer
pnpm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY
```

### 3. Running the Web UI Dashboard
```bash
pnpm dev
# Open http://localhost:3000 in your browser
```

### 4. Running the CLI Runner
```bash
# Review preset sample diffs
pnpm review --sample python
pnpm review --sample react
pnpm review --sample dotnet

# Review any local diff or patch file
pnpm review --diff samples/python_auth.diff

# Export report as Markdown or JSON
pnpm review --diff samples/dotnet_payment.diff --markdown review_report.md
```
