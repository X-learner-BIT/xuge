import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';

const router = Router();

// 登录：支持手机号或邮箱（兼容旧版前端用 email 字段）
const loginSchema = z.object({
  account: z.string().min(1, '请输入手机号或邮箱').optional(),
  email: z.string().optional(),
  password: z.string().min(1, '请输入密码'),
}).refine((data) => data.account || data.email, {
  message: '请输入手机号或邮箱',
  path: ['account'],
});

// 注册：手机号必填，邮箱和昵称可选
const registerSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  password: z.string().min(4, '密码至少4位'),
  confirmPassword: z.string().min(1, '请确认密码'),
  nickname: z.string().optional(),
  email: z.string().email('邮箱格式错误').optional().or(z.literal('')),
});

router.post('/register', async (req, res) => {
  console.log('[REGISTER] request body:', JSON.stringify(req.body));
  try {
    const data = registerSchema.parse(req.body);

    if (data.password !== data.confirmPassword) {
      res.status(400).json({ message: '两次输入的密码不一致' });
      return;
    }

    // 检查手机号是否已注册
    const existingPhone = await prisma.user.findUnique({ where: { phone: data.phone } });
    if (existingPhone) {
      res.status(400).json({ message: '该手机号已被注册' });
      return;
    }

    // 如果提供了邮箱，检查是否已注册
    if (data.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingEmail) {
        res.status(400).json({ message: '该邮箱已被注册' });
        return;
      }
    }

    // 指定手机号自动设为管理员
    const isAdmin = data.phone === '18962574183';

    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        email: data.email || null,
        password: hashPassword(data.password),
        nickname: data.nickname || null,
        role: isAdmin ? 'admin' : 'user',
      },
    });

    const token = signToken({ userId: user.id, phone: user.phone });
    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[REGISTER] zod error:', JSON.stringify(error.errors));
      const firstError = error.errors[0];
      res.status(400).json({ message: firstError?.message || '输入格式错误' });
      return;
    }
    console.error('[REGISTER] unexpected error:', error);
    res.status(500).json({ message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  console.log('[LOGIN] request body:', JSON.stringify(req.body));
  try {
    const data = loginSchema.parse(req.body);

    // 兼容旧版前端：优先用 account，否则用 email
    const account = data.account || data.email || '';

    // 判断是手机号还是邮箱
    const isEmail = account.includes('@');

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: account } })
      : await prisma.user.findUnique({ where: { phone: account } });

    if (!user || !verifyPassword(data.password, user.password)) {
      res.status(401).json({ message: '账号或密码错误' });
      return;
    }

    const token = signToken({ userId: user.id, phone: user.phone });
    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('[LOGIN] zod error:', JSON.stringify(error.errors));
      const firstError = error.errors[0];
      res.status(400).json({ message: firstError?.message || '输入格式错误' });
      return;
    }
    console.error('[LOGIN] unexpected error:', error);
    res.status(500).json({ message: '登录失败' });
  }
});

// 修改昵称
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';

router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nickname } = req.body;
    if (typeof nickname !== 'string' || nickname.trim().length === 0) {
      res.status(400).json({ message: '昵称不能为空' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: { nickname: nickname.trim() },
    });
    res.json({
      user: {
        id: updated.id,
        phone: updated.phone,
        email: updated.email,
        nickname: updated.nickname,
        role: updated.role,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '修改昵称失败' });
  }
});

// 修改密码
router.put('/password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 4) {
      res.status(400).json({ message: '旧密码不能为空，新密码至少4位' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || !verifyPassword(oldPassword, user.password)) {
      res.status(401).json({ message: '旧密码错误' });
      return;
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashPassword(newPassword) },
    });

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '修改密码失败' });
  }
});

// 清除所有学习数据（保留账号）
router.delete('/data', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    // 删除用户的所有笔记（级联删除知识点、题目、答题记录）
    await prisma.note.deleteMany({ where: { userId } });
    res.json({ message: '所有学习数据已清除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '清除数据失败' });
  }
});

export default router;
