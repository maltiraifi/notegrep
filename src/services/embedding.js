import { pipeline } from "@huggingface/transformers";

let embedder = null;
// Declare the initialization promise globally at the file level
let initializationPromise = null;

/**
 * Lazy-load model safely across multiple concurrent queue jobs
 */
export async function getEmbedder() {
  if (embedder) return embedder;

  // If already downloading/loading, return the existing promise so everyone waits for it
  if (initializationPromise) {
    return initializationPromise;
  }

  // Create and assign the loading promise
  initializationPromise = (async () => {
    try {
      console.log("[Embeddings] Loading all-MiniLM-L6-v2...");

      const instance = await pipeline(
        "feature-extraction",
        "Xenova/all-MiniLM-L6-v2",
        {
          dtype: "fp32", // Keeps your terminal clean from dtype spam
        },
      );

      console.log("[Embeddings] Model successfully loaded and ready.");
      embedder = instance;
      return embedder;
    } catch (error) {
      console.error(
        "[Embeddings] CRITICAL: Failed to load embedding model:",
        error.message,
      );

      if (error.message.includes("Protobuf parsing failed")) {
        console.error(
          "[Embeddings] Hint: Run 'rm -rf ~/.cache/huggingface/hub/models--Xenova--all-MiniLM-L6-v2' to clear corrupted files.",
        );
      }

      // Reset the promise on failure so a retry can happen later
      initializationPromise = null;
      throw error;
    }
  })();

  return initializationPromise;
}

/**
 * Convert text → vector
 */
export async function embed(text) {
  try {
    const model = await getEmbedder();

    const output = await model(text, {
      pooling: "mean",
      normalize: true,
    });

    return Array.from(output.data);
  } catch (error) {
    console.error(
      "[Embeddings] Error during single embedding generation:",
      error,
    );
    throw error;
  }
}

/**
 * Convert an array of texts → array of vectors
 */
export async function embedBatch(texts) {
  try {
    const model = await getEmbedder();

    const results = await model(texts, {
      pooling: "mean",
      normalize: true,
    });

    return results.tolist();
  } catch (error) {
    console.error(
      "[Embeddings] Error during batch embedding generation:",
      error,
    );
    throw error;
  }
}
