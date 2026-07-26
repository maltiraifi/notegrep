import { bullConnection } from "../config/bullmq.js";
import { Queue } from "bullmq";

export const vectorQueue = new Queue("vector", bullConnection);
