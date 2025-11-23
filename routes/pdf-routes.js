import express from "express";
import { uploadPDF } from "../controller/pdf-controller.js";
import { upload } from "../middleware/upload.js";
import { auth } from "../middleware/auth.js";

const pdfRouter = express.Router();

pdfRouter.post("/upload", auth, upload.single("pdf"), uploadPDF);

export default pdfRouter;
