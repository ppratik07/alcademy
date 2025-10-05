import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Middleware to protect routes
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not set in environment variables");
    }
    const decoded = jwt.verify(token, jwtSecret);
    if (typeof decoded === "object" && decoded !== null && "userId" in decoded) {
      req.userId = (decoded as { userId: string }).userId;
      next();
    } else {
      return res.status(401).json({ message: "Invalid token payload" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
