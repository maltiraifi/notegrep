import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.js";

export const embedWorker = new Worker(
  "embed",
  async (job) => {
    console.log("Embed job received:", job.data);

    return { success: true };
  },
  bullConnection,
);
