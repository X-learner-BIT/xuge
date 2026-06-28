import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { hashPassword } from '../lib/auth.js';

const router = Router();

// 管理员权限中间件
async function adminMiddleware(req: AuthRequest, res: any, next: any) {
  if (!req.userId) {
    res.status(401).json({ message: '未登录' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (user?.role !== 'admin') {
    res.status(403).json({ message: '无权限访问' });
    return;
  }
  next();
}

// 获取所有用户列表
router.get('/users', authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            notes: true,
            reviewRecords: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(
      users.map((u) => ({
        id: u.id,
        phone: u.phone,
        email: u.email,
        nickname: u.nickname,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        noteCount: u._count.notes,
        reviewCount: u._count.reviewRecords,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 获取单个用户使用情况
router.get('/users/:id/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id as string;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    const noteCount = await prisma.note.count({ where: { userId } });
    const knowledgePointCount = await prisma.knowledgePoint.count({
      where: { note: { userId } },
    });
    const questionCount = await prisma.question.count({
      where: { knowledgePoint: { note: { userId } } },
    });
    const reviewCount = await prisma.reviewRecord.count({ where: { userId } });
    const correctCount = await prisma.reviewRecord.count({
      where: { userId, isCorrect: true },
    });

    // 最近上传的5条笔记
    const recentNotes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    });

    res.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      stats: {
        noteCount,
        knowledgePointCount,
        questionCount,
        reviewCount,
        correctCount,
        accuracy: reviewCount > 0 ? Math.round((correctCount / reviewCount) * 100) : 0,
      },
      recentNotes: recentNotes.map((n) => ({
        id: n.id,
        title: n.title,
        status: n.status,
        createdAt: n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取用户统计失败' });
  }
});

// 修改用户信息（密码/邮箱）
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userId = req.params.id as string;
    const { password, email } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    const data: { password?: string; email?: string | null } = {};
    if (password && password.length >= 4) {
      data.password = hashPassword(password);
    }
    if (email !== undefined) {
      data.email = email || null;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ message: '请提供要修改的字段' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      user: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '修改用户信息失败' });
  }
});

// 修改用户角色
router.put('/users/:id/role', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.params.id as string;
    const { role } = req.body;
    if (role !== 'admin' && role !== 'user') {
      res.status(400).json({ message: '角色只能是 admin 或 user' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }

    // 禁止修改自己的角色（防止管理员把自己降级）
    if (userId === req.userId) {
      res.status(400).json({ message: '不能修改自己的角色' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        phone: true,
        email: true,
        nickname: true,
        role: true,
        createdAt: true,
      },
    });

    res.json({
      user: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '修改角色失败' });
  }
});

// 管理员删除指定用户的笔记
router.delete('/notes/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const noteId = req.params.id as string;
    await prisma.note.delete({ where: { id: noteId } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '删除笔记失败' });
  }
});

export default router;
