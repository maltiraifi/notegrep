export const chunkByCharacters = (text, chunkSize = 500, overlap = 10) => {
  const chunks = [];
  const step = chunkSize - overlap;

  for (let i = 0; i < text.length; i += step) {
    const end = Math.min(text.length, i + chunkSize);
    const chunk = text.slice(i, end);
    chunks.push(chunk);
    if (end >= text.length) break;
  }
  return chunks;
};
