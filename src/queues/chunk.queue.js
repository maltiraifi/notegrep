import { Queue } from "bullmq";
import { bullConnection } from "../config/bullmq.js";

export const chunkQueue = new Queue("chunk", bullConnection);
