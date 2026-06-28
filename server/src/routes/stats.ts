import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// 工作台统计
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // 笔记总数
    const noteCount = await prisma.note.count({
      where: { userId },
    });

    // 知识点总数
    const knowledgePointCount = await prisma.knowledgePoint.count({
      where: { note: { userId } },
    });

    // 复习题完成总数
    const reviewRecordCount = await prisma.reviewRecord.count({
      where: { userId },
    });

    // 薄弱领域数（掌握度 < 50% 的领域数量）
    const weakDomainAgg = await prisma.knowledgePoint.groupBy({
      by: ['domain'],
      where: { note: { userId } },
      _avg: { mastery: true },
      having: { mastery: { _avg: { lt: 50 } } },
    });
    const weakDomainCount = weakDomainAgg.length;

    // 今日答题数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayReviewCount = await prisma.reviewRecord.count({
      where: {
        userId,
        createdAt: { gte: today },
      },
    });

    res.json({
      noteCount,
      knowledgePointCount,
      reviewRecordCount,
      weakDomainCount,
      todayReviewCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取统计失败' });
  }
});

export default router;
