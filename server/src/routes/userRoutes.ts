import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/middleware";

const router = express.Router();
const prisma = new PrismaClient();

// Get user profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/me", authMiddleware, async (req, res) => {
  const { name, password } = req.body;
  //TODO : use zod schema validation

  if (!name && !password) {
    return res
      .status(400)
      .json({ message: "At least one of name or password is required" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { name },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res
      .status(200)
      .json({ message: "User updated successfully", user: updatedUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
