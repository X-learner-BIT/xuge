import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from './lib/prisma.js';
import { hashPassword } from './lib/auth.js';
import authRoutes from './routes/auth.js';
import notesRoutes from './routes/notes.js';
import reviewRoutes from './routes/review.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: 允许前端域名（开发时允许 localhost）
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL || ''].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/review', reviewRoutes);

// 静态文件（上传的文件）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404
app.use((_req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 全局错误处理
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: '服务器内部错误' });
});

// 初始化默认 admin 账号
async function initAdminAccount() {
  try {
    const adminPhone = 'admin';
    const adminPassword = '1234';

    const existing = await prisma.user.findUnique({ where: { phone: adminPhone } });
    if (!existing) {
      await prisma.user.create({
        data: {
          phone: adminPhone,
          password: hashPassword(adminPassword),
          nickname: '管理员',
          role: 'admin',
        },
      });
      console.log('✅ 默认管理员账号已创建: admin / 1234');
    } else {
      console.log('ℹ️ 管理员账号已存在');
    }
  } catch (err) {
    console.error('创建管理员账号失败:', err);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📎 Environment: ${process.env.NODE_ENV || 'development'}`);
  await initAdminAccount();
});
