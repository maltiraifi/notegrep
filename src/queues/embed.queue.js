import { bullConnection } from "../config/bullmq.js";
import { Queue } from "bullmq";

export const embedQueue = new Queue("embed", bullConnection);
