import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/middleware';

const router = express.Router();
const prisma = new PrismaClient();



export default router;
