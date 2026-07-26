import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.js";
import { embedJob } from "../jobs/embed.job.js";

export const embedWorker = new Worker(
  "embed",
  async (job) => {
    return await embedJob(job.data);
  },
  bullConnection,
);
