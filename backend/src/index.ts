import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import { connectDatabase } from "./config/db";

dotenv.config();

const app = express();

// ── Security headers ──
app.use(helmet());

// ── CORS ──
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173").split(",");
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

// ── Body parsing with size limits ──
app.use(express.json({ limit: "1mb" }));

// ── Rate limiting on auth routes (brute-force protection) ──
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ── General API rate limiter ──
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please slow down." },
});

app.use("/api", apiLimiter);

// ── Health check ──
app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "vi-notes-backend" });
});

// ── Routes ──
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log("Backend running on port " + PORT);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start backend";
    console.error(message);
    process.exit(1);
  }
}

void startServer();