import { Router } from "express";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/auth";
import { WritingSession } from "../models/WritingSession";

const router = Router();

function getContentMetrics(content: string) {
  const normalized = content.trim();
  const wordCount = normalized ? normalized.split(/\s+/).length : 0;
  return {
    wordCount,
    charCount: content.length,
  };
}

router.use(authMiddleware);

router.post("/save", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const content = String(req.body.content ?? "");
    const userId = new mongoose.Types.ObjectId(req.userId);

    const metrics = getContentMetrics(content);
    const session = await WritingSession.create({
      userId,
      content,
      ...metrics,
    });

    return res.status(201).json({
      session: {
        id: session._id.toString(),
        content: session.content,
        wordCount: session.wordCount,
        charCount: session.charCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to save writing session" });
  }
});

router.get("/latest", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    const latestSession = await WritingSession.findOne({ userId })
      .sort({ updatedAt: -1 })
      .select("_id content wordCount charCount createdAt updatedAt");

    if (!latestSession) {
      return res.json({ session: null });
    }

    return res.json({
      session: {
        id: latestSession._id.toString(),
        content: latestSession.content,
        wordCount: latestSession.wordCount,
        charCount: latestSession.charCount,
        createdAt: latestSession.createdAt,
        updatedAt: latestSession.updatedAt,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to fetch latest session" });
  }
});

router.get("/history", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);

    const sessions = await WritingSession.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select("_id wordCount charCount createdAt updatedAt");

    return res.json({
      sessions: sessions.map((session) => ({
        id: session._id.toString(),
        wordCount: session.wordCount,
        charCount: session.charCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })),
    });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to fetch sessions" });
  }
});

router.get("/:sessionId", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    const sessionObjectId = new mongoose.Types.ObjectId(sessionId);

    const session = await WritingSession.findOne({
      _id: sessionObjectId,
      userId,
    }).select("_id content wordCount charCount createdAt updatedAt");

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({
      session: {
        id: session._id.toString(),
        content: session.content,
        wordCount: session.wordCount,
        charCount: session.charCount,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to fetch session" });
  }
});

router.delete("/:sessionId", async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { sessionId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    const userId = new mongoose.Types.ObjectId(req.userId);
    const sessionObjectId = new mongoose.Types.ObjectId(sessionId);

    const deletedSession = await WritingSession.findOneAndDelete({
      _id: sessionObjectId,
      userId,
    });

    if (!deletedSession) {
      return res.status(404).json({ message: "Session not found" });
    }

    return res.json({ message: "Session deleted" });
  } catch (_error) {
    return res.status(500).json({ message: "Unable to delete session" });
  }
});

export default router;
