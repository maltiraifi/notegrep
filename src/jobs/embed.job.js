import { vectorQueue } from "../queues/vector.queue.js";
import { embed } from "../services/embedding.js";

export async function embedJob(jobData) {
  const { chunk, documentId, userId, chunkIndex, metadata } = jobData;
  const chunkEmbedding = await embed(chunk);

  await vectorQueue.add("store-vector", {
    documentId,
    userId,
    chunkIndex,
    embedding: chunkEmbedding,
    metadata,
  });

  return { success: true };
}
