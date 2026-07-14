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
  : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];

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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📎 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Build: v2`);
});
