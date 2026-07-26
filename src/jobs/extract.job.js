import { chunkQueue } from "../queues/chunk.queue.js";
import {
  cleanText,
  extractPDFText,
  validatePDFFile,
} from "../services/pdf.service.js";

export async function extractJob({ documentId, filePath, userId }) {
  try {
    if (!validatePDFFile(filePath)) {
      throw new Error(`Invalid or missing file at path: ${filePath}`);
    }
    console.log("Extract job started...");

    const rawText = await extractPDFText(filePath);

    if (!rawText || rawText.length < 10) {
      throw new Error(
        `Extracted text is too short (${rawText?.length || 0} chars)`,
      );
    }

    const cleanedText = cleanText(rawText);

    // FIX: Use .add() method
    await chunkQueue.add("chunk-document", {
      documentId,
      text: cleanedText,
      userId,
      metadata: {
        originalLength: rawText.length,
        cleanedLength: cleanedText.length,
        extractedAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      documentId,
      textLength: cleanedText.length,
    };
  } catch (error) {
    throw error;
  }
}
