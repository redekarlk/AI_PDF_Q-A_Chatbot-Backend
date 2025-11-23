import express from "express";
import { getProfile, login, signup } from "../controller/auth-controller.js";
import { auth } from "../middleware/auth.js";


const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);

// Protected route
authRouter.get("/profile", auth, getProfile);

export default authRouter;
