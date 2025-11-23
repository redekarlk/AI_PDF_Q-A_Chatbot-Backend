// routes/historyRoutes.js
import express from "express";
import { getHistory } from "../controller/history-controller.js";
import { auth } from "../middleware/auth.js";

const historyRouter = express.Router();

// GET /pdf/history
historyRouter.get("/history", auth, getHistory);
// historyRouter.get("/history/pdf/:pdfName", auth, )

export default historyRouter;
