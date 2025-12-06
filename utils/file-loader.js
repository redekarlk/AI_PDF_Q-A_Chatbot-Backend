import fs from "fs";
import path from "path";
import { createRequire } from "module";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";
import AdmZip from "adm-zip";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Try to import pdf-img-convert, handle if missing (due to canvas install issues)
let pdfImgConvert;
try {
  pdfImgConvert = require("pdf-img-convert");
} catch (e) {
  console.warn("pdf-img-convert not found. PDF OCR will be disabled.");
}

export const extractTextFromFile = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf" || mimeType === "application/pdf") {
    const dataBuffer = fs.readFileSync(filePath);
    let text = "";
    
    // 1. Try standard text extraction
    try {
      const pdfData = await pdfParse(dataBuffer);
      text += pdfData.text;
    } catch (e) {
      console.error("PDF Parse failed:", e);
    }

    // 2. If text is sparse (scanned PDF) or to capture images, try OCR
    // Note: This requires pdf-img-convert (and system deps for canvas)
    if (pdfImgConvert) {
      try {
        // Convert pages to images
        const outputImages = await pdfImgConvert.convert(filePath);
        
        for (const imageBuffer of outputImages) {
          const { data: { text: ocrText } } = await Tesseract.recognize(imageBuffer, "eng");
          // Simple heuristic: append if it looks unique or if main text was empty
          text += "\n\n[OCR Content]:\n" + ocrText;
        }
      } catch (e) {
        console.error("PDF OCR failed:", e);
      }
    }

    return text;
  } 
  
  else if (ext === ".docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    let text = "";

    // 1. Extract text
    const result = await mammoth.extractRawText({ path: filePath });
    text += result.value;

    // 2. Extract images from the docx (it's a zip)
    try {
      const zip = new AdmZip(filePath);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        if (entry.entryName.startsWith("word/media/")) {
          const imageBuffer = entry.getData();
          // Check if it's an image we can process
          if (entry.entryName.match(/\.(png|jpg|jpeg)$/i)) {
             const { data: { text: ocrText } } = await Tesseract.recognize(imageBuffer, "eng");
             if (ocrText.trim().length > 5) {
                text += "\n\n[Image Text]:\n" + ocrText;
             }
          }
        }
      }
    } catch (e) {
      console.error("DOCX Image extraction failed:", e);
    }

    return text;
  } 
  
  else if (ext === ".txt" || mimeType === "text/plain") {
    return fs.readFileSync(filePath, "utf-8");
  }

  else if ([".png", ".jpg", ".jpeg"].includes(ext) || mimeType.startsWith("image/")) {
    const { data: { text } } = await Tesseract.recognize(filePath, "eng");
    return text;
  }
  
  else {
    throw new Error("Unsupported file type");
  }
};
