import fs from "fs/promises";
import path from "path";

const STORE_PATH = path.resolve("search_vector_store.json");

export const store = [];

/**
 * Save the current store to a JSON file
 */
async function saveToDisk() {
  try {
    await fs.writeFile(STORE_PATH, JSON.stringify(store), "utf-8");
    console.log(`Saved ${store.length} vectors to disk (${STORE_PATH})`);
  } catch (error) {
    console.error("Failed to save vector store:", error);
  }
}

/**
 * Load the store from a JSON file into memory
 */
export async function loadFromDisk() {
  try {
    const data = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(data);

    store.length = 0;
    store.push(...parsed);

    console.log(`Loaded ${store.length} vectors from disk`);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Add a chunk AND automatically save to disk
 */
export function addVector({
  vector,
  text,
  documentId,
  userId,
  chunkIndex,
  metadata,
}) {
  const id = `vec_${documentId}_${chunkIndex}`;

  const entry = {
    id,
    vector,
    text,
    documentId,
    userId,
    chunkIndex,
    metadata: {
      ...metadata,
      storedAt: new Date().toISOString(),
    },
  };

  store.push(entry);
  return entry;
}

/**
 * Call this after all vectors are added to save the final state
 */
export async function persistStore() {
  await saveToDisk();
}

/**
 * cosine similarity
 */
function cosineSimilarity(a, b) {
  let dot = 0,
    magA = 0,
    magB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function retrieve(queryVector, topK = 5) {
  return store
    .map((entry) => ({
      ...entry,
      score: cosineSimilarity(queryVector, entry.vector),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * search top K
 */
export function search(queryVector, topK = 5) {
  return store
    .map((item) => {
      const score = cosineSimilarity(queryVector, item.vector);

      return {
        ...item,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item, index) => {
      let strength = "WEAK";
      if (item.score > 0.75) strength = "STRONG";
      else if (item.score > 0.6) strength = "MEDIUM";

      return {
        rank: index + 1,
        score: Number(item.score.toFixed(4)),
        strength,
        content: item.text.slice(0, 200),
      };
    });
}
