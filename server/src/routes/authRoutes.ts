import { PrismaClient } from "@prisma/client";
import express from "express";

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

export default router;
