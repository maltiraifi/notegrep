import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.js";
import { extractJob } from "../jobs/extract.job.js";

console.log("🔧 Initializing extract worker...");

export const extractWorker = new Worker(
  "extract",
  async (job) => {
    return await extractJob(job.data);
  },
  bullConnection,
);

extractWorker.on("completed", (job) => {
  console.log(`✅ Extract job ${job.id} completed`);
});

extractWorker.on("failed", (job, err) => {
  console.error(`❌ Extract job ${job.id} failed:`, err);
});

console.log("✅ Extract worker initialized");
