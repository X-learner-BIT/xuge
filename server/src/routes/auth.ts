import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nickname: z.string().optional(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      res.status(400).json({ message: '该邮箱已被注册' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashPassword(data.password),
        nickname: data.nickname || null,
      },
    });

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: '输入格式错误', errors: error.errors });
      return;
    }
    console.error(error);
    res.status(500).json({ message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !verifyPassword(data.password, user.password)) {
      res.status(401).json({ message: '邮箱或密码错误' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email });
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: '输入格式错误', errors: error.errors });
      return;
    }
    console.error(error);
    res.status(500).json({ message: '登录失败' });
  }
});

export default router;
