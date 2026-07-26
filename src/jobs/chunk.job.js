import { embedQueue } from "../queues/embed.queue.js";
import { chunkByCharacters } from "../services/chunk.js";

export async function chunkJob(jobData) {
  const { documentId, text, userId, metadata = {} } = jobData;

  const chunks = chunkByCharacters(text, 500, 10);

  const embedJobs = chunks.map((chunk, index) => {
    return embedQueue.add("embed-chunk", {
      chunk: chunk,
      documentId: documentId,
      userId: userId,
      chunkIndex: index,
      metadata: {
        ...metadata,
        chunkSize: chunks.length,
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
