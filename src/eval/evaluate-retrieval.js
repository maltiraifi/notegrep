/**
 * Retrieval evaluation script.
 *
 * Measures how well the current vector store retrieves the RIGHT chunks
 * for a labeled eval set (see eval_set.json). This is the baseline you
 * compare future chunking strategies against.
 *
 * Usage:
 *   node src/eval/evaluate-retrieval.js <eval_set.json> <documentId> [k]
 *
 * <documentId> is the UUID returned by POST /api/documents/upload when you
 * uploaded the source document the eval set was built from. The script needs
 * it to know which chunks in the (shared) vector store are the "ground truth"
 * candidates for this document.
 *
 * [k] defaults to 5 (Recall@5). Pass a different number to test other cutoffs.
 *
 * Output:
 *   - Console summary (Recall@k, MRR, broken down by difficulty)
 *   - eval_results.json with per-question detail (rank found, top-k preview)
 *     so you can eyeball WHICH questions are failing, not just the aggregate.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { store, loadFromDisk } from "../services/vector.js";
import { embed } from "../services/embedding.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

/**
 * Ranks the WHOLE vector store against a query vector.
 * Deliberately searches across everything in `store`, not just the target
 * document's chunks — a real retrieval query has to find the right needle
 * in the whole haystack, not just re-rank a pre-filtered subset.
 */
function rankStore(queryVector) {
  return store
    .map((entry) => ({
      documentId: entry.documentId,
      chunkIndex: entry.chunkIndex,
      score: cosineSimilarity(queryVector, entry.vector),
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * A question can have multiple expected chunk_indices (hard/multi-chunk
 * questions). We treat it as a HIT if ANY of the expected chunks appears
 * in the top-k, and rank = the best (lowest) rank among them. This avoids
 * penalizing a multi-chunk question as a total miss when the retriever
 * correctly found one of the two relevant chunks.
 */
function findBestRank(rankedResults, documentId, expectedIndices) {
  for (let i = 0; i < rankedResults.length; i++) {
    const r = rankedResults[i];
    if (r.documentId === documentId && expectedIndices.has(r.chunkIndex)) {
      return i + 1; // 1-indexed rank
    }
  }
  return null; // not found anywhere in the store
}

async function main() {
  const [evalSetPathArg, documentId, kArg] = process.argv.slice(2);

  if (!evalSetPathArg || !documentId) {
    console.error(
      "Usage: node src/eval/evaluate-retrieval.js <eval_set.json> <documentId> [k]",
    );
    process.exit(1);
  }

  const k = Number(kArg) || 5;
  const evalSetPath = path.resolve(evalSetPathArg);

  if (!fs.existsSync(evalSetPath)) {
    console.error(`Eval set not found at ${evalSetPath}`);
    process.exit(1);
  }

  const loaded = await loadFromDisk();
  if (!loaded || store.length === 0) {
    console.error(
      "Could not load a non-empty vector store from disk. Has anything been uploaded and processed yet?",
    );
    process.exit(1);
  }

  const docEntryCount = store.filter((e) => e.documentId === documentId).length;
  if (docEntryCount === 0) {
    console.error(
      `No vectors found for documentId "${documentId}". ` +
        `Check the documentId returned by the /upload response for this document.`,
    );
    process.exit(1);
  }
  console.log(
    `Loaded store: ${store.length} total chunks, ${docEntryCount} belong to documentId ${documentId}.`,
  );

  const evalSet = JSON.parse(fs.readFileSync(evalSetPath, "utf-8"));

  const results = [];

  for (const item of evalSet) {
    const queryVector = await embed(item.question);
    const ranked = rankStore(queryVector);
    const expectedIndices = new Set(item.chunk_indices);

    const bestRank = findBestRank(ranked, documentId, expectedIndices);
    const hitAtK = bestRank !== null && bestRank <= k;
    const reciprocalRank = bestRank !== null ? 1 / bestRank : 0;

    results.push({
      id: item.id,
      question: item.question,
      difficulty: item.difficulty,
      expected_chunk_indices: item.chunk_indices,
      best_rank: bestRank,
      hit_at_k: hitAtK,
      reciprocal_rank: Number(reciprocalRank.toFixed(4)),
      top_k_preview: ranked.slice(0, k).map((r) => ({
        documentId: r.documentId,
        chunkIndex: r.chunkIndex,
        score: Number(r.score.toFixed(4)),
      })),
    });

    console.log(
      `[${item.id}] ${hitAtK ? "HIT " : "MISS"} rank=${bestRank ?? "not found"} rr=${reciprocalRank.toFixed(
        3,
      )} — ${item.question.slice(0, 70)}...`,
    );
  }

  const recallAtK = results.filter((r) => r.hit_at_k).length / results.length;
  const mrr =
    results.reduce((sum, r) => sum + r.reciprocal_rank, 0) / results.length;

  const byDifficulty = {};
  for (const r of results) {
    byDifficulty[r.difficulty] ??= { total: 0, hits: 0, rrSum: 0 };
    byDifficulty[r.difficulty].total += 1;
    byDifficulty[r.difficulty].hits += r.hit_at_k ? 1 : 0;
    byDifficulty[r.difficulty].rrSum += r.reciprocal_rank;
  }

  const summary = {
    k,
    documentId,
    totalQuestions: results.length,
    recallAtK: Number(recallAtK.toFixed(4)),
    mrr: Number(mrr.toFixed(4)),
    byDifficulty: Object.fromEntries(
      Object.entries(byDifficulty).map(([diff, s]) => [
        diff,
        {
          count: s.total,
          recallAtK: Number((s.hits / s.total).toFixed(4)),
          mrr: Number((s.rrSum / s.total).toFixed(4)),
        },
      ]),
    ),
  };

  console.log("\n=== Retrieval Evaluation Summary ===");
  console.log(`k = ${k}, questions = ${results.length}`);
  console.log(`Recall@${k}: ${(summary.recallAtK * 100).toFixed(1)}%`);
  console.log(`MRR: ${summary.mrr}`);
  console.log("By difficulty:");
  console.table(summary.byDifficulty);

  const outPath = path.resolve("eval_results.json");
  fs.writeFileSync(outPath, JSON.stringify({ summary, results }, null, 2));
  console.log(`\nFull per-question results written to ${outPath}`);
}

main().catch((err) => {
  console.error("Evaluation failed:", err);
  process.exit(1);
});
