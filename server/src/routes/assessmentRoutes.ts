import express from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/middleware";

const router = express.Router();
const prisma = new PrismaClient();

//GET /api/assessments/topic/:topicId - Get assessment by ID
//TODO: Need to add authmiddleware to all routes
router.get("/topic/:topicId", async (req, res) => {
  const { topicId } = req.params;

  try {
    const assessment = await prisma.assessment.findMany({
      where: { id: topicId },
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.json(assessment);
  } catch (error) {
    console.error("Error fetching assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Get chapter level tests - GET /api/assessments/chapter/:chapterId
router.get("/chapter/:chapterId", async (req, res) => {
  const { chapterId } = req.params;

  try {
    const assessments = await prisma.assessment.findMany({
      where: { chapterId },
    });

    if (!assessments || assessments.length === 0) {
      return res.status(404).json({ message: "No assessments found" });
    }

    res.json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Get assesment details - GET /api/assessments/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    res.json(assessment);
  } catch (error) {
    console.error("Error fetching assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Begin quiz, fetch random questions - POST /api/assessments/:id/start
router.post("/:id/start", async (req, res) => {
  const { id } = req.params;
  const studentId = req.body.studentId; // In real scenario, get from auth token

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { questions: true },
    });

    if (!assessment) {
      return res.status(404).json({ message: "Assessment not found" });
    }

    // Randomize questions (simple shuffle)
    const questions = assessment.questions.sort(() => Math.random() - 0.5);

    // Create a submission record
    const submission = await prisma.assessmentSubmission.create({
      data: {
        assessmentId: id,
        studentId,
        createdAt: new Date(),
      },
    });

    res.json({
      submissionId: submission.id,
      questions: questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        options: q.options,
      })),
    });
  } catch (error) {
    console.error("Error starting assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
//Get questions for the quiz -  GET /api/assessments/:id/questions - Get questions for the quiz
router.get("/:id/questions", async (req, res) => {
  const { id } = req.params;

  try {
    const question = await prisma.question.findMany({
      where: { assessmentId: id },
    });

    if (!question) {
      return res.status(404).json({ message: "Questions not found" });
    }

    res.json(question);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Submit individual answer - POST /api/assessments/questions/:id/answer
router.post("/questions/:id/answer", async (req, res) => {
  const { id } = req.params;
  const { submissionId, answer } = req.body;

  try {
    const question = await prisma.question.findUnique({
      where: { id },
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Check if the answer is correct
    const isCorrect = question.correctAnswer === answer;

    // Save the answer
    await prisma.answer.create({
      data: {
        questionId: id,
        submissionId,
        answer,
        isCorrect,
      },
    });

    res.json({ message: "Answer submitted", isCorrect });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//Submit full quiz - POST /api/assessments/:id/submit
router.post("/:id/submit", async (req, res) => {
  const { id } = req.params;
  const { submissionId } = req.body;

  try {
    //Calculate score
    const answers = await prisma.answer.findMany({
      where: { submissionId },
    });

    if (!answers || answers.length === 0) {
      return res
        .status(400)
        .json({ message: "No answers found for submission" });
    }
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalCount = answers.length;
    const score = (correctCount / totalCount) * 100;

    //Mark as passed/failed
    const assesment = await prisma.assessment.findUnique({
      where: { id },
    });
    const isPassed = score >= (assesment?.passingScore || 60);
    //Update submission record
    await prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: { score, isPassed, submittedAt: new Date() },
    });
    res.json({ message: "Assessment submitted", score, isPassed });
  } catch (error) {
    console.error("Error submitting assessment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
//Get submission details - GET /api/assessments/submissions/:id
router.get("/submissions/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id },
      include: { answers: { include: { question: true } } },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    console.error("Error fetching submission details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

//View Score, feedback,AI explains wrong answers - GET /api/assessments/submissions/:id/results
router.get("/submissions/:id/results", async (req, res) => {
  const { id } = req.params;
  try {
    const submission = await prisma.assessmentSubmission.findUnique({
      where: { id },
      include: { answers: { include: { question: true } } },
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    // AI feedback stub: explain wrong answers
    const feedback = submission.answers.map((answer) => ({
      question: answer.question.questionText,
      yourAnswer: answer.answer,
      correctAnswer: answer.question.correctAnswer,
      isCorrect: answer.isCorrect,
      explanation: answer.isCorrect || "No explanation available.",
    }));

    res.json({
      score: submission.score,
      isPassed: submission.isPassed,
      feedback,
    });
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
