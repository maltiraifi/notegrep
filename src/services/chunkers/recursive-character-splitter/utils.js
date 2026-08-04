export function isTooLarge(text, chunkSize) {
  return text.length > chunkSize;
}

export function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
