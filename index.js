import express from "express";
import cors from "cors";
// import dotenv from "dotenv";
import "dotenv/config";


import connectDB from "./config/db-config.js";
import authRouter from "./routes/auth-routes.js";
import pdfRouter from "./routes/pdf-routes.js";
import queryRouter from "./routes/query-routes.js";
import historyRouter from "./routes/history-routes.js";

const app = express();

// Mongodb calling
connectDB();

// middlewares
// app.use(cors());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

// routes

// user
app.use("/api/user", authRouter);

// pdf
app.use("/api/pdf", pdfRouter);

// query
app.use("/api/v1", queryRouter);

// history
app.use("/api/pdf", historyRouter);



app.get("/", (req, res) => res.send("API Running..."));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
