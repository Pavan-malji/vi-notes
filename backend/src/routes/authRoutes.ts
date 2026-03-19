import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";

const router = Router();

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
}

router.post("/register", async (req, res) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Please provide your full name" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    const token = createToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return res.status(500).json({ message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!isValidEmail(email) || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user.id);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name || "User",
        email: user.email,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to fetch user" });
  }
});

export default router;
