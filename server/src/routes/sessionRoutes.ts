import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/middleware';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {OpenAI} from 'openai';

const router = express.Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const uploadDir = 'uploads/voice-inputs';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
})

const upload = multer({ storage });

//TODO: Need to add authmiddleware to all routes
//POST /api/sessions/start - Start a new session
router.post('/start', async (req, res) => {
  try {
    const { studentId, lessonId } = req.body;
    //TODO : use zod schema validation
    if (!studentId || !lessonId) {
      return res.status(400).json({ message: 'Student and lesson ID are required fields' });
    }
    const session = await prisma.tutoringSession.create({
      data: {
        studentId,
        lessonId,
      },
    });
    res.status(201).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//POST /api/sessions/:id/interact - Send voice/text interaction during a session 
router.post('/:id/interact', async (req, res) => {
  const { id } = req.params;
  const { studentInput, aiResponse } = req.body; // type can be 'voice' or 'text'
  //TODO : use zod schema validation

  if (!studentInput || !aiResponse) {
    return res.status(400).json({ message: 'Null values in studentInput or aiResponse' });
  }

  try {
    const interaction = await prisma.interaction.create({
      data: {
        sessionId: id,
        studentInput,
        aiResponse,
      },
    });
    res.status(201).json(interaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Get Session Details - GET /api/sessions/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.tutoringSession.findUnique({
      where: { id },
      include: { interactions: true },
    });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
//POST /api/sessions/:id/end - End a session
router.post('/:id/end', async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.tutoringSession.update({
      where: { id },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });
    res.status(200).json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

//Get student sessions - GET /api/sessions/student/:studentId
router.get('/student/:studentId', async (req, res) => {
  const { studentId } = req.params;
  try {
    const sessions = await prisma.tutoringSession.findMany({
      where: { studentId },
      include: { lesson: true },
    });
    res.status(200).json(sessions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/sessions/:id/transcript - Get session transcript
router.get('/:id/transcript', async (req, res) => {
  const { id } = req.params;
  try {
    const interactions = await prisma.interaction.findMany({
      where: { sessionId: id },
      orderBy: { timestamp: 'asc' },
    });
    if (interactions.length === 0) {
      return res.status(404).json({ message: 'No interactions found for this session' });
    }
    const transcript = interactions.map(interaction => ({
      studentInput: interaction.studentInput,
      aiResponse: interaction.aiResponse,
      timestamp: interaction.timestamp,
    }));
    res.status(200).json({ transcript });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/sessions/:id/clarification - Request re-explanation or clarification
router.post('/:id/clarification', async (req, res) => {
  const { id } = req.params;
  const { question } = req.body;
  //TODO : use zod schema validation

  if (!question) {
    return res.status(400).json({ message: 'Question is required' });
  }

  try {
    // Placeholder for AI clarification logic
    const aiClarification = `Clarification for question: ${question}`;

    // Save clarification as an interaction
    const clarificationInteraction = await prisma.interaction.create({
      data: {
        sessionId: id,
        studentInput: question,
        aiResponse: aiClarification,
      },
    });
    res.status(201).json(clarificationInteraction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// POST /api/sessions/:id/voice - Upload voice input (stub)
router.post('/:id/voice', upload.single('voice'), async (req, res) => {
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: 'No voice input file uploaded' });
  }
  const session = await prisma.tutoringSession.findUnique({
    where: { id },
  });
  if (!session) {
    fs.unlinkSync(req.file.path); // Delete the uploaded file if session not found
    return res.status(404).json({ message: 'Session not found' });
  }
  // Call OpenAI API to transcribe the audio file
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path) as unknown as Blob,
      model: 'whisper-1',
      response_format: 'text',
      language: 'en',
    });
    // Save the interaction with transcribed text
    const interaction = await prisma.interaction.create({
      data: {
        sessionId: id,
        studentInput: transcription,
        aiResponse: null,
        voiceInputUrl: req.file.path,
        timestamp: new Date(),
      },
    });
    res.status(201).json({
      message: 'Voice input uploaded and transcribed successfully',
      transcription,
      interaction,
      fileUrl: req.file.path,
    });
  } catch (error) {
    console.error('Error during transcription:', error);
    fs.unlinkSync(req.file.path); // Delete the uploaded file on error
    res.status(500).json({ message: 'Error processing voice input' });
  }
  res.status(200).json({ message: 'Voice input received', file: req.file });
});
// GET /api/sessions/:id/voice-response - Get AI voice response (stub)
router.get('/:id/voice-response', authMiddleware, async (req, res) => {
  const { id } = req.params;
  // In a real implementation, retrieve and return the AI-generated voice response here
  res.status(501).json({ message: 'AI voice response retrieval not implemented yet' });
});
export default router;
