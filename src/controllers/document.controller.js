import fs from "fs";
import crypto from "crypto";
import { extractQueue } from "../queues/extract.queue.js";
import { DEFAULT_CHUNKING } from "../config/chunking.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log("File Metadata: ", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const documentId = crypto.randomUUID();

    await extractQueue.add("extract-document", {
      documentId: documentId,
      filePath: req.file.path,
      userId: "anonymous",
      originalName: req.file.originalname,
      chunking: DEFAULT_CHUNKING,
    });

    res.status(200).json({
      message: "File accepted for processing",
      documentId: documentId,
      status: "queued",
    });
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).json({ message: "Error processing file" });
  }
};
