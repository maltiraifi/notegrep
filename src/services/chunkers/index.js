import { fixedChunk } from "./fixed.js";

const strategies = {
  fixed: fixedChunk,
};

export function chunk(text, chunking) {
  const chunker = strategies[chunking.strategy];

  if (!chunker) throw new Error(`Unknown chunk strategy: ${chunking.strategy}`);

  return chunker(text, chunking.options); // returns the result i.e. chunks = [...]
}
