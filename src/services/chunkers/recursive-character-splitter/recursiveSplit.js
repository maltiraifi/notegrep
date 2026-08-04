import { splitBySeparator } from "./splitBySeparator";
import { isTooLarge } from "./utils";

export function recursiveSplit(text, separators, chunkSize) {
  // base cases
  if (!isTooLarge(text, chunkSize)) {
    return [text];
  }

  if (separators.length === 0) {
    return [text];
  }

  // current & remaining separators
  const currentSeparator = separators[0];
  const remainingSeparators = separators.slice(1);

  // split by separator
  const pieces = splitBySeparator(text, currentSeparator);

  const results = [];

  // check pieces size & pushing to results array
  for (const piece of pieces) {
    if (!isTooLarge(piece, chunkSize)) {
      results.push(piece);
    } else {
      results.push(...recursiveSplit(piece, remainingSeparators, chunkSize));
    }
  }

  return results;
}
