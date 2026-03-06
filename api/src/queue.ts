import { Queue } from "bullmq";

const connection = {
  host: process.env.VALKEY_HOST || "localhost",
  port: Number(process.env.VALKEY_PORT) || 6379,
};

export const checksQueue = new Queue("checks", { connection });
