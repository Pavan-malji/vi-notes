import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// ── Validation helpers ──

const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= MAX_EMAIL_LENGTH;
}

function isStrongPassword(password: string): { valid: boolean; reason?: string } {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, reason: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { valid: false, reason: "Password is too long" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one lowercase letter" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one uppercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, reason: "Password must contain at least one number" };
  }
  return { valid: true };
}

/** Strip anything that isn't a letter, space, hyphen, or apostrophe */
function sanitizeName(raw: string): string {
  return raw.replace(/[^a-zA-Z\s'-]/g, "").trim().slice(0, MAX_NAME_LENGTH);
}

function createToken(userId: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });
}

// ── Routes ──

router.post("/register", async (req, res) => {
  try {
    const firstName = sanitizeName(String(req.body.firstName ?? ""));
    const lastName = sanitizeName(String(req.body.lastName ?? ""));
    const email = String(req.body.email ?? "").trim().toLowerCase();
    const password = String(req.body.password ?? "");

    if (!firstName || firstName.length < 2) {
      return res.status(400).json({ message: "First name must be at least 2 characters" });
    }

    if (!lastName || lastName.length < 2) {
      return res.status(400).json({ message: "Last name must be at least 2 characters" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email" });
    }

    const passwordCheck = isStrongPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ message: passwordCheck.reason });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ firstName, lastName, email, passwordHash });

    const token = createToken(user.id);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Registration failed" });
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
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Login failed" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("_id firstName lastName email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to fetch user" });
  }
});

export default router;
