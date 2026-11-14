import dotenv from "dotenv";
import { buildServer } from "./server.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

async function main() {
  try {
    const server = await buildServer();
    await server.listen({ port: PORT, host: HOST });
    console.log(`\n======================================================`);
    console.log(`  DiffSensei AI Code Review Agent Server Running!`);
    console.log(`  URL: http://localhost:${PORT}`);
    console.log(`  Health API: http://localhost:${PORT}/api/health`);
    console.log(`  Review API: POST http://localhost:${PORT}/api/review`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error("Fatal error starting DiffSensei server:", err);
    process.exit(1);
  }
}

main();
