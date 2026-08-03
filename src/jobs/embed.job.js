import { vectorQueue } from "../queues/vector.queue.js";
import { embed } from "../services/embedding.js";

export async function embedJob(jobData) {
  const { chunk, documentId, userId, processing, chunkIndex, metadata } =
    jobData;
  const chunkEmbedding = await embed(chunk);

  await vectorQueue.add("store-vector", {
    documentId,
    userId,
    chunkIndex,
    chunk,
    embedding: chunkEmbedding,
    processing,
    metadata,
  });

  return { success: true };
}
