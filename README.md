# ⚡ DiffSensei: Autonomous AI Code Review Agent

> **FlexGCC AI Engineer Practical Exercise**  
> **Candidate:** Prabhat Ranjan Singh (`topi9864@gmail.com` | [GitHub](https://github.com/prabhattopi) | [LinkedIn](https://www.linkedin.com/in/prabhat-ranjan-singh-71296721b/))  
> **Full-Stack Architecture:** React 19, Tailwind CSS v4, Node.js, Fastify, TypeScript, Google Gemini Flash, Zod

---

## 1. What It Does

**DiffSensei** is an autonomous full-stack AI agent that ingests a code change (Git diff, `.patch` file, or live GitHub Pull Request URL) and returns **strict, structured engineering feedback**:

* 🐛 **Possible Bugs:** Detects runtime exceptions, null-pointer dereferences, off-by-one errors, conditional assignment bugs (`if (x = 0)`), and async anti-patterns (`async void`)—complete with file/line citations and copyable code fixes.
* ⚠️ **Risks & Security:** Evaluates security vulnerabilities (SQL injection, XSS via `dangerouslySetInnerHTML`, credential leakage), breaking API changes, data integrity concerns, and concurrency hazards with concrete mitigation steps.
* 🧪 **Missing Tests:** Analyzes business logic additions vs PR test coverage to flag uncovered edge cases, boundary conditions, and provides copyable test assertions.
* 🎨 **Style & Clean Code:** Surfaces naming conventions, dead code, leftover debug statements (`console.log`, `print()`), and architectural clean-code violations.
* 📊 **Quality Score & Verdict:** Issues an automated decision (`APPROVED`, `REQUEST_CHANGES`, `COMMENT`) alongside an overall code health score (0–100).

The application is engineered as a **monorepo** featuring:
1. **Interactive Frontend (`frontend/`):** Built with **React 19**, **Tailwind CSS v4**, **TypeScript**, and **Vite**, featuring a component-driven dashboard, live multi-tool telemetry visualizer, 1-click sample presets, and copyable fix widgets.
2. **High-Performance Backend (`backend/`):** Built with **Node.js**, **Fastify**, **TypeScript**, and **Google Gemini Flash**, orchestrating 4 deterministic inspection tools with strict Zod schema validation.
3. **Standalone CLI Runner:** Run directly in any CI/CD or terminal via `pnpm review`.

---

## 2. Full-Stack System Architecture

```
                                  USER INTERFACE
         ┌───────────────────────────────────────────────────────────────┐
         │     REACT 19 + TAILWIND CSS v4 DASHBOARD (frontend/)          │
         │  • Header with Candidate Info & Model Telemetry               │
         │  • 1-Click Preset Loaders (Python, React 19, C# / .NET)        │
         │  • Diff Editor / GitHub PR URL Fetcher                        │
         │  • Interactive Finding Tabs (Bugs, Risks, Tests, Style)       │
         │  • 1-Click Copy Fixes & Markdown/JSON Exporters               │
         └──────────────────────────────┬────────────────────────────────┘
                                        │ HTTP REST (Fastify API)
                                        ▼
         ┌───────────────────────────────────────────────────────────────┐
         │             FASTIFY SERVER ENGINE (backend/)                  │
         │  • POST /api/review          • GET /api/sample-diffs          │
         │  • GET  /api/health          • Static Single-Page App Hosting │
         └──────────────────────────────┬────────────────────────────────┘
                                        │
                                        ▼
         ┌───────────────────────────────────────────────────────────────┐
         │             PHASE 1: DETERMINISTIC AGENT TOOLS                │
         │  • diffParser         -> Hunk parsing & +/- line indexing     │
         │  • syntaxChecker      -> Brackets balance & AST sanity        │
         │  • securityScanner    -> RegEx/AST patterns for SQLi, secrets │
         │  • testGapAnalyzer    -> Core logic vs PR test coverage       │
         └──────────────────────────────┬────────────────────────────────┘
                                        │ Pre-computed Tool Signals
                                        ▼
         ┌───────────────────────────────────────────────────────────────┐
         │          PHASE 2: LLM REASONING & SYNTHESIS (GEMINI)          │
         │  • Model: Google Gemini Flash via @google/generative-ai       │
         │  • Config: responseMimeType: 'application/json', temp: 0.1    │
         │  • Schema Enforcement: Zod validation on incoming JSON payload│
         └──────────────────────────────┬────────────────────────────────┘
                                        ▼
         ┌───────────────────────────────────────────────────────────────┐
         │              OUTPUT: STRICT STRUCTURED FEEDBACK               │
         │  • Web Dashboard (Live Telemetry, Cards, Markdown Export)     │
         │  • CLI Runner (ANSI Colors, Markdown / JSON Report Exporters) │
         └───────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions:
* **React 19 & Tailwind CSS v4:** Utilizes modern React 19 hooks and state management with the new lightning-fast Tailwind CSS v4 engine (`@tailwindcss/vite`), offering clean dark-mode visuals and responsive split-pane layout.
* **Fastify & TypeScript:** Provides low-overhead asynchronous request handling with built-in schema validation and static asset hosting.
* **Deterministic Tool Layer:** Before making LLM calls, 4 dedicated static tools run to extract hard signals (AST syntax issues, credentials, SQL string interpolations, missing test coverage).
* **Guaranteed Schema Enforcement:** Output is strictly typed with Zod (`StructuredReviewFeedbackSchema`). Any malformed markdown blocks are cleansed by `sanitizeJsonResponse()`.
* **Zero-Crash Offline Fallback:** If the external LLM encounters network boundaries or rate limits, the agent automatically falls back to `generateDeterministicFallback()` using static tool signals.

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
git clone https://github.com/prabhattopi/FlexGCC-AI-Code-Reviewer.git
cd FlexGCC-AI-Code-Reviewer
pnpm install
```

### 2. Environment Setup
Create `.env` in `backend/` (or copy from `.env.example`):
```bash
cp .env.example backend/.env
# Edit backend/.env and paste your GEMINI_API_KEY
```

### 3. Running in Development Mode
You can run both backend and frontend concurrently:

**Terminal 1 (Backend - Fastify API):**
```bash
pnpm dev:backend
# API running on http://localhost:3000
```

**Terminal 2 (Frontend - React 19 + Tailwind v4):**
```bash
pnpm dev:frontend
# Vite running on http://localhost:5173 (auto-proxies /api to Fastify)
```

### 4. Running Unified Production Build
Build the React 19 app and run the unified Fastify server:
```bash
pnpm build
pnpm start
# Opens complete full-stack app at http://localhost:3000
```

### 5. Running the CLI Runner
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
