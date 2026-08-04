import { escapeRegex } from "./utils";

export function splitBySeparator(text, separator) {
  if (separator === "") {
    return [...text];
  }

  const escaped = escapeRegex(separator);
  const regex = new RegExp(`(${escaped})`);
  const parts = text.split(regex);

  const rebuilt = [];

  for (i = 0; i < parts.length; i++) {
    const textPart = parts[i];
    const separatorPart = parts[i + 1] ?? "";

    const piece = textPart + separatorPart;

    if (piece.length > 0) {
      rebuilt.push(piece);
    }
  }

  return rebuilt;
}
