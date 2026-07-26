import { bullConnection } from "../config/bullmq.js";
import { Queue } from "bullmq";

export const extractQueue = new Queue("extract", bullConnection);
