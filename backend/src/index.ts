import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import sessionRoutes from "./routes/sessionRoutes";
import { connectDatabase } from "./config/db";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "vi-notes-backend" });
});

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