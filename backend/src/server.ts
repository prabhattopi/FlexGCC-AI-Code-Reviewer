import fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import path from "path";
import { fileURLToPath } from "url";
import { CodeReviewAgent } from "./agent.js";
import { SAMPLE_DIFFS } from "./sampleDiffs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildServer(): Promise<FastifyInstance> {
  const app = fastify({
    logger: {
      transport: {
        target: "pino-pretty",
        options: {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname",
        },
      },
    },
  });

  // Enable CORS
  await app.register(cors, {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  });

  // Serve Static Frontend Dashboard
  const publicPath = path.join(__dirname, "../public");
  await app.register(fastifyStatic, {
    root: publicPath,
    prefix: "/",
  });

  const agent = new CodeReviewAgent();

  // Health Endpoint
  app.get("/api/health", async () => {
    return {
      status: "OK",
      timestamp: new Date().toISOString(),
      agent: "DiffSensei AI Code Reviewer",
      geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"),
      model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    };
  });

  // Sample Diffs Endpoint
  app.get("/api/sample-diffs", async () => {
    return {
      success: true,
      samples: Object.values(SAMPLE_DIFFS),
    };
  });

  // Main Review Endpoint
  app.post<{
    Body: {
      diffText?: string;
      prUrl?: string;
      sampleId?: string;
      customInstructions?: string;
    };
  }>("/api/review", async (request, reply) => {
    let { diffText, prUrl, sampleId, customInstructions } = request.body || {};

    // 1. If sampleId is provided, retrieve preset diff
    if (sampleId && SAMPLE_DIFFS[sampleId]) {
      diffText = SAMPLE_DIFFS[sampleId].diff;
    }

    // 2. If GitHub PR URL is provided, fetch diff from GitHub
    if (!diffText && prUrl) {
      try {
        diffText = await fetchGitHubPrDiff(prUrl);
      } catch (err: any) {
        return reply.status(400).send({
          success: false,
          error: `Failed to fetch GitHub PR diff: ${err.message}`,
        });
      }
    }

    if (!diffText || diffText.trim().length === 0) {
      return reply.status(400).send({
        success: false,
        error: "Missing diff content. Please provide 'diffText', a valid 'prUrl', or select a 'sampleId'.",
      });
    }

    try {
      const startTime = Date.now();
      const feedback = await agent.reviewCodeChange({
        diffText,
        prUrl,
        customInstructions,
      });
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        durationMs,
        data: feedback,
      };
    } catch (err: any) {
      request.log.error(err);
      return reply.status(500).send({
        success: false,
        error: err.message || "Internal agent review execution failed.",
      });
    }
  });

  return app;
}

/**
 * Helper to fetch raw git diff from GitHub PR URL
 */
async function fetchGitHubPrDiff(prUrl: string): Promise<string> {
  const cleanUrl = prUrl.replace(/\/+$/, "");
  const diffUrl = cleanUrl.endsWith(".diff") ? cleanUrl : `${cleanUrl}.diff`;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3.diff",
    "User-Agent": "DiffSensei-Code-Review-Agent",
  };

  const ghToken = process.env.GITHUB_TOKEN?.trim();
  if (ghToken && ghToken !== "your_github_token_optional") {
    headers["Authorization"] = `Bearer ${ghToken}`;
  }

  const response = await fetch(diffUrl, { headers });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return await response.text();
}
