import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { analyzeNote } from '../services/ai.js';
import { extractContent } from '../utils/extractContent.js';

const router = Router();
const upload = multer({ dest: path.join(process.cwd(), 'uploads/'), limits: { fileSize: 100 * 1024 * 1024 } });

// 包装 multer 中间件，用于捕获并记录上传错误
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

// 查找管理员用户
async function getAdminUser() {
  return prisma.user.findFirst({ where: { role: 'admin' } });
}

// 判断管理员是否已有相同内容的笔记（基于标题+内容前200字去重）
async function isDuplicateForAdmin(adminId: string, originalNoteId: string, title: string, content: string): Promise<boolean> {
  // 优先通过 originalNoteId 精确去重（最可靠）
  const exactMatch = await prisma.note.findFirst({
    where: {
      userId: adminId,
      originalNoteId,
    },
  });
  if (exactMatch) return true;

  // 兜底：通过 title + content 前200字模糊去重
  const contentPreview = content.slice(0, 200);
  const fuzzyMatch = await prisma.note.findFirst({
    where: {
      userId: adminId,
      title,
      content: { startsWith: contentPreview },
    },
  });
  return !!fuzzyMatch;
}

// 同步更新管理员副本（重新分析时调用）
async function syncAdminNote(
  originalNoteId: string,
  title: string,
  contentType: string,
  content: string | null,
  filePath: string | null,
  summary: string | null,
  tags: string[],
  knowledgePoints: any[]
) {
  const admin = await getAdminUser();
  if (!admin) return;

  // 查找管理员是否已有该笔记的副本
  const adminNote = await prisma.note.findFirst({
    where: {
      userId: admin.id,
      originalNoteId,
    },
  });

  if (adminNote) {
    // 更新已有副本
    await prisma.note.update({
      where: { id: adminNote.id },
      data: {
        title,
        contentType,
        content,
        filePath,
        aiSummary: summary,
        tags,
        status: 'completed',
      },
    });
    // 删除旧知识点，创建新知识点
    await prisma.knowledgePoint.deleteMany({ where: { noteId: adminNote.id } });
    if (knowledgePoints.length > 0) {
      await prisma.knowledgePoint.createMany({
        data: knowledgePoints.map((kp) => ({
          name: kp.name,
          description: kp.description,
          domain: kp.domain,
          mastery: kp.mastery,
          noteId: adminNote.id,
        })),
      });
    }
    console.log(`[Admin Sync] Updated note "${title}" for admin`);
  }
  // 如果没有副本，不自动创建（避免重新分析时意外创建）
}

// 启动时清理管理员账户中的重复笔记
async function cleanupAdminDuplicates() {
  try {
    const admin = await getAdminUser();
    if (!admin) return;

    // 找出管理员所有没有 originalNoteId 的笔记（旧数据），按 title+content 去重
    const adminNotes = await prisma.note.findMany({
      where: { userId: admin.id },
      orderBy: { createdAt: 'asc' },
    });

    const seen = new Map<string, string>(); // key: title+content前200字 -> noteId
    const duplicates: string[] = [];

    for (const note of adminNotes) {
      if (note.originalNoteId) {
        // 有 originalNoteId 的笔记，检查是否重复
        const key = `orig:${note.originalNoteId}`;
        if (seen.has(key)) {
          duplicates.push(note.id);
        } else {
          seen.set(key, note.id);
        }
      } else {
        // 没有 originalNoteId 的旧数据，用 title+content 去重
        const contentPreview = (note.content || '').slice(0, 200);
        const key = `${note.title}||${contentPreview}`;
        if (seen.has(key)) {
          duplicates.push(note.id);
        } else {
          seen.set(key, note.id);
        }
      }
    }

    if (duplicates.length > 0) {
      // 删除重复笔记及其知识点
      await prisma.knowledgePoint.deleteMany({
        where: { noteId: { in: duplicates } },
      });
      await prisma.note.deleteMany({
        where: { id: { in: duplicates } },
      });
      console.log(`[Admin Cleanup] Removed ${duplicates.length} duplicate notes for admin`);
    }
  } catch (err) {
    console.error('[Admin Cleanup] Failed:', err);
  }
}

// 将笔记复制给管理员（去重）
async function copyNoteToAdmin(
  originalNoteId: string,
  userId: string,
  title: string,
  contentType: string,
  content: string | null,
  filePath: string | null,
  summary: string | null,
  tags: string[],
  knowledgePoints: any[]
) {
  const admin = await getAdminUser();
  if (!admin || admin.id === userId) return; // 没有管理员或是管理员自己上传，不复制

  // 去重：管理员已有相同笔记，不再存储
  if (content && await isDuplicateForAdmin(admin.id, originalNoteId, title, content)) {
    console.log(`[Admin Dedup] Skipped duplicate note "${title}" for admin`);
    return;
  }

  const adminNote = await prisma.note.create({
    data: {
      title,
      contentType,
      content,
      filePath,
      aiSummary: summary,
      tags,
      status: 'completed',
      userId: admin.id,
      syncedFrom: userId, // 标记来源：从哪个用户同步过来的
      originalNoteId,     // 保存原始笔记ID，用于精确去重
    },
  });

  if (knowledgePoints.length > 0) {
    await prisma.knowledgePoint.createMany({
      data: knowledgePoints.map((kp) => ({
        name: kp.name,
        description: kp.description,
        domain: kp.domain,
        mastery: kp.mastery,
        noteId: adminNote.id,
      })),
    });
  }

  console.log(`[Admin Copy] Note "${title}" copied to admin, ${knowledgePoints.length} knowledge points`);
}

// 获取笔记列表（管理员可查看所有并支持来源筛选，普通用户只看自己的）
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const isAdmin = user?.role === 'admin';
    const source = req.query.source as string | undefined; // 'self' | 'synced'

    let where: any = isAdmin ? {} : { userId: req.userId };

    // 管理员来源筛选
    if (isAdmin && source) {
      if (source === 'self') {
        where = { userId: req.userId, syncedFrom: null };
      } else if (source === 'synced') {
        where = { userId: req.userId, syncedFrom: { not: null } };
      }
    }

    const notes = await prisma.note.findMany({
      where,
      include: { knowledgePoints: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '获取笔记失败' });
  }
});

// 获取单个笔记（管理员可查看任何人的）
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const where: any = { id: req.params.id as string };
    if (currentUser?.role !== 'admin') {
      where.userId = req.userId;
    }
    const note = await prisma.note.findFirst({
      where,
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

    // 修复中文乱码并去掉后缀名
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
      // 解析失败仍继续保存笔记，只是内容为空
      text = '';
      images = [];
      isScannedPdf = false;
    }

    // 截断内容防止超出数据库字段限制（LONGText 上限约 4GB，这里留安全余量）
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

    // 异步 AI 分析（同时传入图片）
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
      // 复制给管理员（去重）
      await copyNoteToAdmin(
        note.id,
        req.userId!,
        title,
        contentType,
        safeContent,
        file.path,
        result.summary,
        result.tags,
        result.knowledgePoints
      );
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
        // 复制给管理员（去重）
        await copyNoteToAdmin(
          note.id,
          req.userId!,
          title,
          'text',
          content,
          null,
          result.summary,
          result.tags,
          result.knowledgePoints
        );
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

// 重新分析笔记
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

    // 重新提取内容（包括图片）
    let text = note.content || '';
    let images: Buffer[] = [];
    let isScannedPdf = false;
    if (note.filePath && (note.contentType === 'pdf' || note.contentType === 'docx')) {
      const extracted = await extractContent(note.filePath, note.contentType);
      text = extracted.text;
      images = extracted.images;
      isScannedPdf = extracted.isScannedPdf;
      // 更新数据库中的文本内容
      await prisma.note.update({
        where: { id: note.id },
        data: { content: text },
      });
    }

    // 先重置状态并删除旧数据
    await prisma.note.update({
      where: { id: note.id },
      data: { status: 'analyzing', aiSummary: null, tags: [] },
    });
    await prisma.knowledgePoint.deleteMany({ where: { noteId: note.id } });

    // 异步重新分析
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
      // 同步更新管理员副本
      await syncAdminNote(note.id, note.title, note.contentType, text, note.filePath, result.summary, result.tags, result.knowledgePoints);
    }).catch(async () => {
      await prisma.note.update({
        where: { id: note.id },
        data: { status: 'failed' },
      });
    });

    res.json({ success: true, message: '重新分析已触发' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '重新分析失败' });
  }
});

// 更新笔记（管理员可更新任何人的）
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { title, content } = req.body;
    if (!title && !content) {
      res.status(400).json({ message: '标题和内容不能同时为空' });
      return;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const note = await prisma.note.findFirst({
      where: currentUser?.role === 'admin'
        ? { id: req.params.id as string }
        : { id: req.params.id as string, userId: req.userId },
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

// 删除笔记（管理员可删除任何人的，普通用户只能删自己的）
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const currentUser = await prisma.user.findUnique({ where: { id: req.userId } });
    const where: any = { id: req.params.id as string };
    if (currentUser?.role !== 'admin') {
      where.userId = req.userId;
    }
    const { count } = await prisma.note.deleteMany({ where });
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

export { cleanupAdminDuplicates };
export default router;
