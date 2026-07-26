import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.js";

export const vectorWorker = new Worker(
  "vector",
  async (job) => {
    console.log("Vector job received:", job.data);
    // Your vector logic here
    return { success: true };
  },
  bullConnection,
);
