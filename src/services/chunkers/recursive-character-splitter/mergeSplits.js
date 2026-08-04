export function mergeSplits(pieces, chunkSize, separator = "") {
  const merged = [];

  const currentChunk = "";

  for (const piece of pieces) {
    const nextChunk = currentChunk ? currentChunk + separator + piece : piece;

    if (nextChunk.length <= chunkSize) {
      currentChunk = nextChunk;
    } else {
      if (currentChunk) {
        merged.push(currentChunk);
      }

      currentChunk = piece;
    }
  }

  if (currentChunk) {
    merged.push(currentChunk);
  }

  return merged;
}
