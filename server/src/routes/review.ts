import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { generateQuestions } from '../services/ai.js';

const router = Router();

// 生成复习题目
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const count = Math.min(Number(req.body.count) || 5, 20);
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        note: { userId: req.userId },
      },
      orderBy: { mastery: 'asc' }, // 优先掌握度低的
      take: count * 2,
    });

    if (knowledgePoints.length === 0) {
      res.status(400).json({ message: '暂无知识点，请先上传笔记' });
      return;
    }

    const questions = await generateQuestions(knowledgePoints, count);

    // 保存题目到数据库
    const created = await prisma.$transaction(
      questions.map((q, i) =>
        prisma.question.create({
          data: {
            questionText: q.questionText,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            domain: q.domain,
            knowledgePointId: knowledgePoints[i % knowledgePoints.length].id,
          },
        })
      )
    );

    res.json({
      questions: created.map((q) => ({
        id: q.id,
        knowledgePoint: knowledgePoints.find((kp) => kp.id === q.knowledgePointId)?.name || '',
        question: q.questionText,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '生成题目失败' });
  }
});

// 提交答案
router.post('/submit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { knowledgePoint: true },
    });

    if (!question) {
      res.status(404).json({ message: '题目不存在' });
      return;
    }

    const isCorrect = userAnswer === question.correctAnswer;

    // 记录答题
    await prisma.reviewRecord.create({
      data: {
        userId: req.userId!,
        questionId,
        userAnswer,
        isCorrect,
      },
    });

    // 更新掌握度
    const currentMastery = question.knowledgePoint.mastery;
    const newMastery = isCorrect
      ? Math.min(100, currentMastery + 10)
      : Math.max(0, currentMastery - 5);

    await prisma.knowledgePoint.update({
      where: { id: question.knowledgePointId },
      data: { mastery: newMastery },
    });

    res.json({
      isCorrect,
      explanation: question.explanation,
      correctAnswer: question.correctAnswer,
      updatedMastery: newMastery,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '提交答案失败' });
  }
});

// 获取报告
router.get('/report', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const records = await prisma.reviewRecord.findMany({
      where: { userId: req.userId },
      include: { question: { include: { knowledgePoint: true } } },
    });

    const totalQuestions = records.length;
    const correctCount = records.filter((r) => r.isCorrect).length;
    const totalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // 按领域统计
    const domainMap = new Map<string, { total: number; correct: number }>();
    for (const record of records) {
      const domain = record.question.domain || '通用';
      const current = domainMap.get(domain) || { total: 0, correct: 0 };
      current.total++;
      if (record.isCorrect) current.correct++;
      domainMap.set(domain, current);
    }

    const domainMastery = Array.from(domainMap.entries()).map(([domain, stats]) => ({
      domain,
      mastery: Math.round((stats.correct / stats.total) * 100),
    }));

    // 薄弱知识点（掌握度 < 50%）
    const weakPoints = await prisma.knowledgePoint.findMany({
      where: {
        note: { userId: req.userId },
        mastery: { lt: 50 },
      },
      orderBy: { mastery: 'asc' },
      take: 10,
    });

    res.json({
      totalScore,
      totalQuestions,
      correctCount,
      domainMastery,
      weakPoints: weakPoints.map((wp) => ({
        name: wp.name,
        domain: wp.domain,
        mastery: wp.mastery,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取报告失败' });
  }
});

// 获取领域掌握度
router.get('/domain-mastery', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const points = await prisma.knowledgePoint.findMany({
      where: { note: { userId: req.userId } },
    });

    const domainMap = new Map<string, { total: number; masterySum: number; count: number }>();
    for (const point of points) {
      const domain = point.domain || '通用';
      const current = domainMap.get(domain) || { total: 0, masterySum: 0, count: 0 };
      current.total++;
      current.masterySum += point.mastery;
      current.count++;
      domainMap.set(domain, current);
    }

    const domains = Array.from(domainMap.entries()).map(([domain, stats]) => ({
      domain,
      mastery: Math.round(stats.masterySum / stats.count),
      pointCount: stats.total,
    }));

    res.json({ domains });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取领域掌握度失败' });
  }
});

export default router;
