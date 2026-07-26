import { Worker } from "bullmq";
import { bullConnection } from "../config/bullmq.js";
import { redis } from "../config/redis.js";
import { addVector, persistStore } from "../services/vector.js";

export const vectorWorker = new Worker(
  "vector",
  async (job) => {
    const { documentId, userId, chunkIndex, chunk, embedding, metadata } =
      job.data;

    await addVector({
      vector: embedding,
      text: chunk || "No text available",
      documentId,
      userId,
      chunkIndex,
      metadata: {
        ...metadata,
        storedAt: new Date().toISOString(),
      },
    });

    const processed = await redis.incr(`doc:${documentId}:processed`);
    const total = await redis.get(`doc:${documentId}:total`);

    if (processed >= parseInt(total)) {
      console.log(`DOCUMENT ${documentId} FULLY COMPLETE!`);
      await persistStore();
    }

    return { success: true };
  },
  bullConnection,
);

vectorWorker.on("completed", (job, result) => {
  console.log(`Vector job ${job.id} DONE! Result:`, result);
});
