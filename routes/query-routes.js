import express from "express";
import { queryPDF } from "../controller/query-controller.js";
import { auth } from "../middleware/auth.js";

const queryRouter = express.Router();

queryRouter.post("/query", auth, queryPDF);

export default queryRouter;
