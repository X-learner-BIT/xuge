import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { generateQuestions } from '../services/ai.js';
import { openai, model, llmEnabled } from '../lib/llm.js';

const router = Router();

// 生成复习题目（支持选择题和简答题）
router.post('/generate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const count = Math.min(Number(req.body.count) || 5, 20);
    const questionType = req.body.questionType === 'fill' ? 'fill' : 'choice';
    const creativeMode = req.body.creativeMode === true;
    const noteIds: string[] = Array.isArray(req.body.noteIds) ? req.body.noteIds : [];

    // 构建查询条件：如果传了 noteIds，则只查询这些笔记的知识点
    const where: any = {
      note: { userId: req.userId },
    };
    if (noteIds.length > 0) {
      where.noteId = { in: noteIds };
    }

    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where,
      orderBy: { mastery: 'asc' },
      take: count * 2,
    });

    if (knowledgePoints.length === 0) {
      res.status(400).json({ message: '所选笔记暂无知识点，请先上传笔记并等待AI分析完成' });
      return;
    }

    const questions = await generateQuestions(knowledgePoints, count, questionType, creativeMode);

    // 保存题目到数据库
    const created = await prisma.$transaction(
      questions.map((q, i) =>
        prisma.question.create({
          data: {
            questionType,
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
        questionType: q.questionType,
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

// 提交答案（选择题直接比对，简答题记录后显示标准答案）
router.post('/submit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { questionId, userAnswer } = req.body;
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { knowledgePoint: { include: { note: true } } },
    });

    if (!question) {
      res.status(404).json({ message: '题目不存在' });
      return;
    }

    // 校验题目是否属于当前用户
    if (question.knowledgePoint.note.userId !== req.userId) {
      res.status(403).json({ message: '无权访问该题目' });
      return;
    }

    // 支持多选题：将答案按字母排序后比较（如 "C,A" 和 "A,C" 视为相同）
    const normalizeAnswer = (ans: string) =>
      ans.split(/[,，]/).map((s) => s.trim()).filter(Boolean).sort().join(',');
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.correctAnswer);

    // 记录答题
    await prisma.reviewRecord.create({
      data: {
        userId: req.userId!,
        questionId,
        userAnswer,
        isCorrect,
      },
    });

    // 更新掌握度（简答题只要提交就算部分正确，选择题严格比对）
    const currentMastery = question.knowledgePoint.mastery;
    const masteryDelta = question.questionType === 'fill'
      ? (isCorrect ? 10 : 3)
      : (isCorrect ? 10 : -5);
    const newMastery = question.questionType === 'fill'
      ? Math.min(100, currentMastery + masteryDelta)
      : isCorrect
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
      questionType: question.questionType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '提交答案失败' });
  }
});

// AI 对话答题模式
router.post('/ai-chat', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { noteIds, messages } = req.body;
    const targetNoteIds: string[] = Array.isArray(noteIds) ? noteIds : [];

    if (!llmEnabled || !openai) {
      res.status(503).json({ message: 'AI 对话服务暂时不可用，请稍后重试' });
      return;
    }

    // 获取知识点上下文
    const where: any = {
      note: { userId: req.userId },
    };
    if (targetNoteIds.length > 0) {
      where.noteId = { in: targetNoteIds };
    }

    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where,
      take: 20,
      include: { note: true },
    });

    if (knowledgePoints.length === 0) {
      res.status(400).json({ message: '所选笔记暂无知识点，请先上传笔记并等待AI分析完成' });
      return;
    }

    const kpContext = knowledgePoints.map((kp) =>
      `- ${kp.name}（${kp.domain || '通用'}）: ${kp.description || '无描述'}`
    ).join('\n');

    // 构建对话历史
    const chatMessages: any[] = [
      {
        role: 'system',
        content: `你是一位耐心的学习导师，正在帮助学生复习知识点。你的任务是根据知识点出题、评判学生的回答，并给出有价值的反馈。

规则：
1. 如果这是对话开始（学生还没答题），请出一道基于知识点的思考题
2. 如果学生已经回答了问题，请评判回答的质量：
   - 指出回答中的正确部分和不足之处
   - 给出标准答案或更完善的答案
   - 简要解释相关知识点
   - 然后出下一道相关的题目
3. 每次只出一道题，题目要有启发性
4. 保持鼓励的语气，不要打击学生积极性
5. 回复控制在 300 字以内

以下是需要复习的知识点：
${kpContext}`,
      },
    ];

    // 添加历史消息
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          chatMessages.push({ role: msg.role, content: String(msg.content) });
        }
      }
    }

    const completion = await openai.chat.completions.create({
      model,
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices[0]?.message?.content || '抱歉，我暂时无法响应，请稍后再试。';

    res.json({ reply });
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    res.status(500).json({ message: 'AI 对话服务异常，请稍后重试' });
  }
});

// 获取报告
router.get('/report', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // 答题记录
    const records = await prisma.reviewRecord.findMany({
      where: { userId },
      include: { question: { include: { knowledgePoint: true } } },
      orderBy: { createdAt: 'desc' },
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

    // 薄弱知识点
    const weakPoints = await prisma.knowledgePoint.findMany({
      where: {
        note: { userId },
        mastery: { lt: 50 },
      },
      orderBy: { mastery: 'asc' },
      take: 10,
    });

    // 知识点统计
    const allKnowledgePoints = await prisma.knowledgePoint.findMany({
      where: { note: { userId } },
      select: { mastery: true },
    });
    const knowledgePointStats = {
      total: allKnowledgePoints.length,
      mastered: allKnowledgePoints.filter((k) => k.mastery >= 80).length,
      improving: allKnowledgePoints.filter((k) => k.mastery >= 50 && k.mastery < 80).length,
      weak: allKnowledgePoints.filter((k) => k.mastery < 50).length,
    };

    // 题型统计
    const choiceRecords = records.filter((r) => r.question.questionType === 'choice');
    const fillRecords = records.filter((r) => r.question.questionType === 'fill');
    const questionTypeStats = {
      choice: {
        total: choiceRecords.length,
        correct: choiceRecords.filter((r) => r.isCorrect).length,
      },
      fill: {
        total: fillRecords.length,
        correct: fillRecords.filter((r) => r.isCorrect).length,
      },
    };

    // 最近答题记录（最近5条）
    const recentRecords = records.slice(0, 5).map((r) => ({
      id: r.id,
      questionText: r.question.questionText.slice(0, 80) + (r.question.questionText.length > 80 ? '…' : ''),
      isCorrect: r.isCorrect,
      createdAt: r.createdAt.toISOString(),
      domain: r.question.domain || r.question.knowledgePoint.domain || '通用',
      questionType: r.question.questionType,
    }));

    // 笔记数量
    const noteCount = await prisma.note.count({ where: { userId } });

    // 连续答题天数
    const streakDays = await calculateStreakDays(userId);

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
      knowledgePointStats,
      questionTypeStats,
      recentRecords,
      noteCount,
      streakDays,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取报告失败' });
  }
});

// 计算连续答题天数
async function calculateStreakDays(userId: string): Promise<number> {
  const records = await prisma.reviewRecord.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  if (records.length === 0) return 0;

  const dates = records.map((r) => {
    const d = new Date(r.createdAt);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);

  let streak = 1;
  const oneDay = 24 * 60 * 60 * 1000;
  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i - 1] - uniqueDates[i] === oneDay) {
      streak++;
    } else {
      break;
    }
  }

  // 如果今天没有答题，则 streak 为 0
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (uniqueDates[0] !== today.getTime()) {
    const yesterday = new Date(today.getTime() - oneDay);
    if (uniqueDates[0] !== yesterday.getTime()) {
      streak = 0;
    }
  }

  return streak;
}

// 获取领域掌握度（支持按笔记筛选）
router.get('/domain-mastery', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const noteId = req.query.noteId as string | undefined;

    const where: any = { note: { userId: req.userId } };
    if (noteId) {
      where.noteId = noteId;
    }

    const points = await prisma.knowledgePoint.findMany({ where });

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

// 获取掌握趋势
router.get('/trends', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const days = 7;
    const result: { date: string; count: number; correctCount: number; mastery: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const records = await prisma.reviewRecord.findMany({
        where: {
          userId,
          createdAt: { gte: d, lt: next },
        },
      });

      const count = records.length;
      const correctCount = records.filter((r) => r.isCorrect).length;
      const mastery = count > 0 ? Math.round((correctCount / count) * 100) : 0;

      const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
      result.push({ date: dateLabel, count, correctCount, mastery });
    }

    res.json({ trends: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取趋势失败' });
  }
});

// 获取错题本
router.get('/wrong-questions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const wrongRecords = await prisma.reviewRecord.findMany({
      where: { userId, isCorrect: false },
      include: { question: { include: { knowledgePoint: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const map = new Map<
      string,
      { questionText: string; domain: string | null; wrongCount: number; knowledgePoint: string }
    >();

    for (const r of wrongRecords) {
      const qid = r.questionId;
      if (!map.has(qid)) {
        map.set(qid, {
          questionText: r.question.questionText,
          domain: r.question.domain || r.question.knowledgePoint.domain,
          wrongCount: 0,
          knowledgePoint: r.question.knowledgePoint.name,
        });
      }
      map.get(qid)!.wrongCount++;
    }

    const items = Array.from(map.entries()).map(([id, val]) => ({
      id,
      name: val.knowledgePoint,
      domain: val.domain || '通用',
      wrongCount: val.wrongCount,
    }));

    res.json({ items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取错题本失败' });
  }
});

export default router;
