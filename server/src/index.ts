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
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';
import { cleanupAdminDuplicates } from './routes/notes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS: 允许前端域名（开发时允许 localhost，生产环境兼容 GitHub Pages 子路径）
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || '',
      'https://x-learner-bit.github.io',
      'https://x-learner-bit.github.io/xuge',
    ].filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());

// 根路径（Railway 健康检查默认访问 /）
app.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'xuge-api', time: new Date().toISOString() });
});

// 健康检查
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

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

// Railway deploy trigger

// 初始化默认 admin 账号
async function initAdminAccount() {
  try {
    const adminPhone = '18962574183';
    const adminPassword = 'xl040207';

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
      console.log('✅ 默认管理员账号已创建: 18962574183 / xl040207');
    } else {
      // 确保已有账号 role 为 admin
      if (existing.role !== 'admin') {
        await prisma.user.update({ where: { id: existing.id }, data: { role: 'admin' } });
      }
      console.log('ℹ️ 管理员账号已存在');
    }
  } catch (err) {
    console.error('创建管理员账号失败:', err);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📎 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Build: v2`);
  await initAdminAccount();
  // 启动时清理管理员账户中的重复笔记
  await cleanupAdminDuplicates();
});
