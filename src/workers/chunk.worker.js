import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.js";
import { chunkJob } from "../jobs/chunk.job.js";

export const chunkWorker = new Worker(
  "chunk",
  async (job) => {
    return await chunkJob(job.data);
  },
  bullConnection,
);
