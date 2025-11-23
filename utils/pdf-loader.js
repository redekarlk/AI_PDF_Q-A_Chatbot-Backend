// import fs from "fs";
// import { createRequire } from "module";

// const require = createRequire(import.meta.url);
// const pdfParse = require("pdf-parse");

// export const extractTextFromPDF = async (filePath) => {
//     const dataBuffer = fs.readFileSync(filePath);
//     const pdfData = await pdfParse(dataBuffer);

//     return pdfData.text;
// };



import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pdfParse = require("pdf-parse");

export const extractTextFromPDF = async (filePath) => {
    // Temporarily suppress pdfjs warnings
    const originalWarn = console.warn;
    console.warn = () => {};

    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    // Restore original warn
    console.warn = originalWarn;

    return data.text;
};
