import { Worker, Job } from "bullmq";
import { db } from "./db/index.js";
import { checks, monitors } from "./db/schema.js";
import { eq } from "drizzle-orm";

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379", 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const FETCH_TIMEOUT_MS = 10_000;

interface CheckJob {
  monitorId: number;
  url: string;
}

async function processCheck(job: Job<CheckJob>) {
  const { monitorId, url } = job.data;
  const start = Date.now();

  let statusCode: number | null = null;
  let status: "up" | "down" | "error" = "error";
  let message: string | null = null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    statusCode = response.status;
    status = statusCode >= 200 && statusCode < 400 ? "up" : "down";
  } catch (err) {
    status = "error";
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        message = `Timeout after ${FETCH_TIMEOUT_MS}ms`;
      } else {
        message = err.message;
      }
    } else {
      message = "Unknown error";
    }
  }

  const responseTime = Date.now() - start;

  await db.insert(checks).values({
    monitorId,
    statusCode,
    responseTime,
    status,
    message,
    checkedAt: new Date(),
  });

  await db
    .update(monitors)
    .set({ status, updatedAt: new Date() })
    .where(eq(monitors.id, monitorId));

  console.log(
    `[check] monitor=${monitorId} url=${url} status=${status} code=${statusCode} time=${responseTime}ms`
  );
}

const worker = new Worker<CheckJob>("checks", processCheck, {
  connection: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
});

worker.on("ready", () => {
  console.log(
    `Worker connected to Redis at ${REDIS_HOST}:${REDIS_PORT}, listening on queue "checks"`
  );
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  process.exit(0);
});
