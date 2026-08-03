import { redis } from "../config/redis.js";
import { embedQueue } from "../queues/embed.queue.js";
import { chunk } from "../services/chunkers/index.js";

export async function chunkJob(jobData) {
  const { documentId, text, userId, processing, metadata = {} } = jobData;

  const chunks = chunk(text, processing.chunking);

  await redis.set(`doc:${documentId}:total`, chunks.length);
  await redis.set(`doc:${documentId}:processed`, 0);

  const embedJobs = chunks.map((chunk, index) => {
    return embedQueue.add("embed-chunk", {
      documentId: documentId,
      userId: userId,
      chunkIndex: index,
      chunk: chunk,
      processing,
      metadata: {
        ...metadata,
        chunking: {
          totalChunks: chunks.length,
        },
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
