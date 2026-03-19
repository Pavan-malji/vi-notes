import { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ message: "JWT_SECRET is not configured" });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload;
    req.userId = payload.userId;
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
