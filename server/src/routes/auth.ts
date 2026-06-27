import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, verifyPassword, signToken } from '../lib/auth.js';

const router = Router();

// 登录：支持手机号或邮箱
const loginSchema = z.object({
  account: z.string().min(1, '请输入手机号或邮箱'),
  password: z.string().min(1, '请输入密码'),
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

    const user = await prisma.user.create({
      data: {
        phone: data.phone,
        email: data.email || null,
        password: hashPassword(data.password),
        nickname: data.nickname || null,
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
      const firstError = error.errors[0];
      res.status(400).json({ message: firstError?.message || '输入格式错误' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // 判断是手机号还是邮箱
    const isEmail = data.account.includes('@');

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: data.account } })
      : await prisma.user.findUnique({ where: { phone: data.account } });

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
      const firstError = error.errors[0];
      res.status(400).json({ message: firstError?.message || '输入格式错误' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: '登录失败' });
  }
});

export default router;
