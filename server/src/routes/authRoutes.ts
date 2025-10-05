import { PrismaClient } from "@prisma/client";
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

const prisma = new PrismaClient();

router.post("/register", async (req, res) => {
  const { email, name, password } = req.body;
  //TODO : use zod schema validation

  if (!email || !name || !password) {
    return res
      .status(400)
      .json({ message: "Email, name and password are required" });
  }
  try {
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    //TODO: hash password
    const newUser = await prisma.user.create({
      data: { email, name, password },
    });
    return res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  //TODO : use zod schema validation

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    //TODO: compare hashed password
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });
    return res.status(200).json({ message: "Login successful", user, token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/refresh-token", (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ message: "Token is required" });
  }
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT secret not set in environment variables");
    }
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    const newToken = jwt.sign({ userId: decoded.userId }, jwtSecret, {
      expiresIn: "1h",
    });
    return res.status(200).json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
});
export default router;
