import fs from "fs";
import { PDFParse } from "pdf-parse";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!req.file.path) {
      console.error("File path is missing. File object:", req.file);
      return res.status(500).json({
        message: "File was not saved properly. Check multer configuration.",
      });
    }

    console.log("File Metadata: ", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    let data;
    try {
      const parser = new PDFParse({ data: fileBuffer });
      data = await parser.getText();
      await parser.destroy();
    } catch (parseError) {
      console.error("PDF Parse Error:", parseError);
      return res.status(400).json({
        message:
          "Failed to parse PDF. The file might be corrupted or password-protected.",
        error: parseError.message,
      });
    }

    console.log("Extracted Text Length: ", data.text.length);
    console.log("First 100 chars: ", data.text.substring(0, 100));

    res.status(200).json({
      message: "File parsed successfully",
      fileName: req.file.originalname,
      textPreview: data.text.substring(0, 200) + "...", // Just send back the beginning
    });
  } catch (err) {
    console.error("Error processing file:", err);
    res.status(500).json({ message: "Error processing file" });
  }
};
