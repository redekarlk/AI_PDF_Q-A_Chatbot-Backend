import User from "../model/auth-model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const exist = await User.findOne({ email });
        if (exist) return res.status(400).json({ msg: "User already exists" });

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({ name, email, password: hashed });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // Send response
        res.json({
            msg: "Signup successful",
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });

    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};


export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "User not found" });

        // Compare passwords
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ msg: "Invalid password" });

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            msg: "Login successful",
            token,
            user: { id: user._id, name: user.name, email: user.email },
        });

    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};



export const getProfile = async (req, res) => {
    try {
        // req.userId comes from auth middleware
        const user = await User.findById(req.userId).select("-password");

        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        res.json({
            msg: "Profile fetched successfully",
            user,
        });

    } catch (err) {
        res.status(500).json({ msg: "Server error", error: err.message });
    }
};
