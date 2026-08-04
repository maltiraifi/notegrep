import { DEFAULT_SEPARATORS } from "./constants";
import { mergeSplits } from "./mergeSplits";
import { recursiveSplit } from "./recursiveSplit";

export class RecursiveCharacterSplitter {
  constructor({
    chunkSize = 1000,
    chunkOverlap = 0,
    separators = DEFAULT_SEPARATORS,
  } = {}) {
    (this.chunkSize = chunkSize),
      (this.chunkOverlap = chunkOverlap),
      (this.separators = separators);
  }

  split(text) {
    const pieces = recursiveSplit(text, this.separators, this.chunkSize);
    return mergeSplits(pieces, this.chunkSize);
  }
}
