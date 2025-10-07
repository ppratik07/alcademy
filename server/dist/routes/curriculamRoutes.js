import express from 'express';
import { PrismaClient } from '@prisma/client';
const router = express.Router();
const prisma = new PrismaClient();
//GET /api/curriculum/subjects - List all subjects
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await prisma.subject.findMany();
        res.status(200).json(subjects);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/subjects/:id - Get subject details by ID
router.get('/subjects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const subject = await prisma.subject.findUnique({
            where: { id: req.params.id },
        });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }
        res.status(200).json(subject);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/subjects/:id/chapters - List chapters for a subject
router.get('/subjects/:id/chapters', async (req, res) => {
    const { id } = req.params;
    try {
        const chapters = await prisma.chapter.findMany({
            where: { subjectId: id },
        });
        res.status(200).json(chapters);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/chapters/:id - Get chapter details by ID
router.get('/chapters/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const chapter = await prisma.chapter.findUnique({
            where: { id: req.params.id },
        });
        if (!chapter) {
            return res.status(404).json({ message: 'Chapter not found' });
        }
        res.status(200).json(chapter);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/chapters/:id/topics - List topics for a chapter
router.get('/chapters/:id/topics', async (req, res) => {
    const { id } = req.params;
    try {
        const topics = await prisma.topic.findMany({
            where: { chapterId: id },
        });
        res.status(200).json(topics);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/topics/:id - Get topic details by ID
router.get('/topics/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const topic = await prisma.topic.findUnique({
            where: { id: req.params.id },
        });
        if (!topic) {
            return res.status(404).json({ message: 'Topic not found' });
        }
        res.status(200).json(topic);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/topics/:id/lessons - List lessons for a topic
router.get('/topics/:id/lessons', async (req, res) => {
    const { id } = req.params;
    try {
        const lessons = await prisma.lesson.findMany({
            where: { topicId: id },
        });
        res.status(200).json(lessons);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
//GET /api/curriculum/lessons/:id - Get lesson details by ID
router.get('/lessons/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: req.params.id },
        });
        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }
        res.status(200).json(lesson);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
export default router;
