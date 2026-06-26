import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { analyzeNote } from '../services/ai.js';
import { extractTextFromFile } from '../utils/extractText.js';

const router = Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

// 获取笔记列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const notes = await prisma.note.findMany({
      where: { userId: req.userId },
      include: { knowledgePoints: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取笔记失败' });
  }
});

// 获取单个笔记
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { knowledgePoints: true },
    });
    if (!note) {
      res.status(404).json({ message: '笔记不存在' });
      return;
    }
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取笔记失败' });
  }
});

// 上传文件笔记
router.post('/upload', authMiddleware, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: '未上传文件' });
      return;
    }

    const title = req.body.title || file.originalname;
    const contentType = file.mimetype === 'application/pdf' ? 'pdf' : 'docx';
    const content = await extractTextFromFile(file.path, contentType);

    const note = await prisma.note.create({
      data: {
        title,
        contentType,
        content,
        filePath: file.path,
        userId: req.userId!,
      },
    });

    // 异步 AI 分析
    analyzeNote(content || '').then(async (result) => {
      await prisma.note.update({
        where: { id: note.id },
        data: {
          aiSummary: result.summary,
          tags: result.tags,
          status: 'completed',
        },
      });
      await prisma.knowledgePoint.createMany({
        data: result.knowledgePoints.map((kp) => ({
          ...kp,
          noteId: note.id,
        })),
      });
    }).catch(async () => {
      await prisma.note.update({
        where: { id: note.id },
        data: { status: 'failed' },
      });
    });

    res.json({ id: note.id, title: note.title, status: note.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '上传失败' });
  }
});

// 创建文字笔记
router.post('/text', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      res.status(400).json({ message: '标题和内容不能为空' });
      return;
    }

    const note = await prisma.note.create({
      data: {
        title,
        contentType: 'text',
        content,
        userId: req.userId!,
      },
    });

    // 异步 AI 分析
    analyzeNote(content).then(async (result) => {
      await prisma.note.update({
        where: { id: note.id },
        data: {
          aiSummary: result.summary,
          tags: result.tags,
          status: 'completed',
        },
      });
      await prisma.knowledgePoint.createMany({
        data: result.knowledgePoints.map((kp) => ({
          ...kp,
          noteId: note.id,
        })),
      });
    }).catch(async () => {
      await prisma.note.update({
        where: { id: note.id },
        data: { status: 'failed' },
      });
    });

    res.json({ id: note.id, title: note.title, status: note.status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '创建笔记失败' });
  }
});

// 删除笔记
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    await prisma.note.deleteMany({
      where: { id: req.params.id, userId: req.userId },
    });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '删除失败' });
  }
});

export default router;
