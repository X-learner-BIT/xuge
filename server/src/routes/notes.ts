import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { analyzeNote } from '../services/ai.js';
import { extractContent } from '../utils/extractContent.js';

const router = Router();
const upload = multer({ dest: path.join(process.cwd(), 'uploads/'), limits: { fileSize: 100 * 1024 * 1024 } });

const uploadSingleWithDebug = (fieldName: string) => {
  return (req: AuthRequest, res: any, next: any) => {
    upload.single(fieldName)(req, res, (err: any) => {
      if (err) {
        console.error('[Upload Debug] Multer error:', err.code, err.message);
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ message: '文件过大，请上传不超过 50MB 的文件' });
        }
        return res.status(400).json({ message: '文件上传失败：' + (err.message || err.code) });
      }
      next();  
    });
  };
};

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where: { userId: req.userId },
        include: { knowledgePoints: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.note.count({ where: { userId: req.userId } }),
    ]);

    res.json({
      data: notes,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取笔记失败' });
  }
});

router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
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

router.post('/upload', authMiddleware, uploadSingleWithDebug('file'), async (req: AuthRequest, res) => {
  console.log('[Upload Debug] content-type:', req.headers['content-type']);
  console.log('[Upload Debug] req.file:', req.file);
  console.log('[Upload Debug] req.body:', req.body);
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ message: '未上传文件' });
      return;
    }

    const rawName = req.body.title || Buffer.from(file.originalname, 'binary').toString('utf8');
    const title = rawName.replace(/\.(pdf|docx)$/i, '');
    const contentType = file.mimetype === 'application/pdf' ? 'pdf' : 'docx';
    let text = '';
    let images: Buffer[] = [];
    let isScannedPdf = false;
    try {
      const extracted = await extractContent(file.path, contentType);
      text = extracted.text;
      images = extracted.images;
      isScannedPdf = extracted.isScannedPdf;
    } catch (extractErr: any) {
      console.error('[Upload] Content extraction failed:', extractErr?.message || extractErr);
      text = '';
      images = [];
      isScannedPdf = false;
    }

    const MAX_CONTENT_LENGTH = 500_000;
    const safeContent = text.length > MAX_CONTENT_LENGTH ? text.slice(0, MAX_CONTENT_LENGTH) + '\n\n[内容已截断]' : text;

    const note = await prisma.note.create({
      data: {
        title,
        contentType,
        content: safeContent,
        filePath: file.path,
        userId: req.userId!,
      },
    });

    analyzeNote(text || '', images, isScannedPdf).then(async (result) => {
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
    }).catch(async (err: any) => {
      console.error('[AI Analysis] Failed for note', note.id, err?.message || err);
      await prisma.note.update({
        where: { id: note.id },
        data: { status: 'failed' },
      });
    });

    res.json({ id: note.id, title: note.title, status: note.status });
  } catch (error: any) {
    console.error('[Upload] 500 Error:', error);
    res.status(500).json({
      message: '上传失败',
      detail: error?.message || String(error),
      stack: process.env.NODE_ENV !== 'production' ? error?.stack : undefined,
    });
  }
});

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

    analyzeNote(content)
      .then(async (result) => {
        console.log(
          `[AI Analysis] Note ${note.id}: extracted ${result.knowledgePoints.length} knowledge points from ${content.length} chars of text`
        );
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
      })
      .catch(async (err) => {
        console.error(`[AI Analysis] Note ${note.id} failed:`, err);
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

router.post('/:id/reanalyze', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
    });
    if (!note) {
      res.status(404).json({ message: '笔记不存在' });
      return;
    }
    if (!note.content && !note.filePath) {
      res.status(400).json({ message: '笔记无内容可分析' });
      return;
    }

    let text = note.content || '';
    let images: Buffer[] = [];
    let isScannedPdf = false;
    if (note.filePath && (note.contentType === 'pdf' || note.contentType === 'docx')) {
      try {
        const extracted = await extractContent(note.filePath, note.contentType);
        text = extracted.text;
        images = extracted.images;
        isScannedPdf = extracted.isScannedPdf;
        await prisma.note.update({
          where: { id: note.id },
          data: { content: text },
        });
      } catch (extractErr: any) {
        console.warn(`[Reanalyze] File re-extraction failed for ${note.filePath}, using cached content:`, extractErr?.message || extractErr);
        text = note.content || '';
        images = [];
        isScannedPdf = false;
      }
    }

    await prisma.note.update({
      where: { id: note.id },
      data: { status: 'analyzing', aiSummary: null, tags: [] },
    });
    await prisma.knowledgePoint.deleteMany({ where: { noteId: note.id } });

    analyzeNote(text, images, isScannedPdf).then(async (result) => {
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
    }).catch(async (err) => {
      console.error('[Reanalyze] Analysis failed:', err);
      await prisma.note.update({
        where: { id: note.id },
        data: { status: 'failed' },
      });
    });

    res.json({ success: true, message: '重新分析已触发' });
  } catch (error: any) {
    console.error('[Reanalyze] Error:', error);
    res.status(500).json({ message: '重新分析失败', detail: error?.message || String(error) });
  }
});

router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      res.status(400).json({ message: '标题和内容不能同时为空' });
      return;
    }

    const note = await prisma.note.findFirst({
      where: { id: req.params.id as string, userId: req.userId },
    });
    if (!note) {
      res.status(404).json({ message: '笔记不存在' });
      return;
    }

    const data: { title?: string; content?: string } = {};
    if (title) data.title = title;
    if (content !== undefined) data.content = content;

    const updated = await prisma.note.update({
      where: { id: req.params.id as string },
      data,
      include: { knowledgePoints: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '更新笔记失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { count } = await prisma.note.deleteMany({
      where: { id: req.params.id as string, userId: req.userId },
    });
    if (count === 0) {
      res.status(404).json({ message: '笔记不存在或无权删除' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '删除失败' });
  }
});

export default router;