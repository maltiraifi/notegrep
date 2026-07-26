import { redis } from "../config/redis.js";
import { embedQueue } from "../queues/embed.queue.js";
import { chunkByCharacters } from "../services/chunk.js";

export async function chunkJob(jobData) {
  const { documentId, text, userId, metadata = {} } = jobData;

  const CHUNK_SIZE = 500;
  const OVERLAP = 10;

  const chunks = chunkByCharacters(text, CHUNK_SIZE, OVERLAP);

  await redis.set(`doc:${documentId}:total`, chunks.length);
  await redis.set(`doc:${documentId}:processed`, 0);

  const embedJobs = chunks.map((chunk, index) => {
    return embedQueue.add("embed-chunk", {
      chunk: chunk,
      documentId: documentId,
      userId: userId,
      chunkIndex: index,
      totalChunks: chunks.length,
      metadata: {
        ...metadata,
        chunkSize: CHUNK_SIZE,
        totalChunks: chunks.length,
        strategy: "fixed-character",
      },
    });
  });

  await Promise.all(embedJobs);

  return {
    success: true,
    userId: userId,
    documentId: documentId,
    totalChunks: chunks.length,
  };
}
