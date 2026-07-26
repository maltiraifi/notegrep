import fs from "fs";
import { PDFParse } from "pdf-parse";

export async function extractPDFText(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBuffer });
    const data = await parser.getText();
    await parser.destroy();

    return data.text;
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

export function validatePDFFile(filePath) {
  if (!filePath) return false;
  if (!fs.existsSync(filePath)) return false;

  const stats = fs.statSync(filePath);
  if (stats.size === 0) return false;
  return true;
}

export function cleanText(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
