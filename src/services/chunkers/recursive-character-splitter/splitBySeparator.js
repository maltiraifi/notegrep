export function splitBySeparator(text, separator) {
  if (separator === "") {
    return [...text];
  }
  return text.split(separator);
}
