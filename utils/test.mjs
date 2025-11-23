// const { default: pdfParse } = await import("pdf-parse");

// console.log(typeof pdfParse);



// import pkg from "pdf-parse";
// const pdfParse = pkg.default || pkg;

// console.log(typeof pdfParse);



import { createRequire } from "module";
const require = createRequire(import.meta.url);

const pdfParse = require("pdf-parse");

console.log(typeof pdfParse);




// import { createRequire } from "module";
// const require = createRequire(import.meta.url);

// const pdfParse = require("pdf-parse");

// console.log("TYPE:", typeof pdfParse);
// console.log("IS FUNCTION:", typeof pdfParse === "function");
// console.log("KEYS:", Object.keys(pdfParse));
// console.log("VALUE:", pdfParse);
