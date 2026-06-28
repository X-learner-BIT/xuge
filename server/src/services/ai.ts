import type { KnowledgePoint, Question } from '../types.js';
import { openai, model, llmEnabled, analyzeImages } from '../lib/llm.js';

export async function analyzeNote(
  content: string,
  images?: Buffer[],
  isScannedPdf?: boolean
): Promise<{
  summary: string;
  tags: string[];
  knowledgePoints: Omit<KnowledgePoint, 'id' | 'noteId'>[];
}> {
  if (isScannedPdf) {
    return {
      summary: '该文档为扫描版PDF，暂无法自动提取文本内容。建议将PDF转换为可编辑格式后重新上传，或使用OCR工具预处理。',
      tags: ['扫描文档'],
      knowledgePoints: [],
    };
  }

  if (!llmEnabled || !openai) {
    console.warn('[AI] LLM not configured, falling back to heuristic analysis');
    return heuristicAnalyze(content);
  }

  // 1. 先分析图片（如果有），图片分析结果单独保留，不占用文本截断空间
  let imageAnalysis = '';
  if (images && images.length > 0) {
    console.log(`[AI] Analyzing ${images.length} images from document...`);
    imageAnalysis = await analyzeImages(
      images,
      '这些图片来自一份学习笔记文档。请仔细阅读每张图片，提取其中包含的知识点、概念、图表信息、公式和重要结论。请用中文详细描述图片中的教育内容，按图片顺序分别说明。'
    );
    console.log('[AI] Image analysis completed, length:', imageAnalysis.length);
  }

  // 2. 判断是否需要 Map-Reduce 分段提取
  const MAX_SINGLE_LENGTH = 40000; // 超过此长度使用分段提取
  if (content.length > MAX_SINGLE_LENGTH) {
    console.log(`[AI] Content too long (${content.length} chars), using Map-Reduce strategy`);
    return analyzeNoteMapReduce(content, imageAnalysis);
  }

  // 3. 普通单次提取
  return analyzeNoteSingle(content, imageAnalysis);
}

// 单次提取（内容不太长时）
async function analyzeNoteSingle(
  content: string,
  imageAnalysis: string
): Promise<{
  summary: string;
  tags: string[];
  knowledgePoints: Omit<KnowledgePoint, 'id' | 'noteId'>[];
}> {
  const MAX_TEXT_LENGTH = 80000;
  const truncatedLength = content.length;
  const safeContent = truncatedLength > MAX_TEXT_LENGTH ? content.slice(0, MAX_TEXT_LENGTH) : content;

  if (truncatedLength > MAX_TEXT_LENGTH) {
    console.log(`[AI] Text truncated: ${truncatedLength} → ${MAX_TEXT_LENGTH} chars (lost ${truncatedLength - MAX_TEXT_LENGTH} chars)`);
  }

  // 图片分析作为独立补充，不占用文本截断空间
  const fullContent = imageAnalysis
    ? `[文档文本内容]\n${safeContent}\n\n[文档图片内容分析]\n${imageAnalysis}`
    : safeContent;

  const systemPrompt = `你是一位资深的教育内容分析师和知识工程师。你的任务是对学习笔记进行深度结构化分析，提取真正有价值的知识点。

核心原则：
1. 知识点必须是独立的"概念"或"原理"，而不是随便摘录的句子
2. 知识点命名要使用专业术语，精准概括概念本质
3. description 要包含：定义是什么、核心内容、为什么重要/有什么用
4. 不要提取目录、页码、标题层级等元信息
5. 不要提取"本章节介绍了..."这种无实质内容的概括句
6. 如果笔记有多个主题，要覆盖主要主题，不要只集中在第一个主题
7. 优先提取能够用于考试或实际应用的知识点

输出格式必须是严格的 JSON，不要有任何markdown代码块标记或其他文字。`;

  const userPrompt = `请对以下笔记进行深度分析，提取核心知识点。

要求：
1. summary: 用2-3句话精准概括笔记的核心主题和主要内容，不要只是截取原文开头
2. tags: 提取2-5个领域标签，反映笔记涉及的学科领域（如：微观经济学、数据结构、机器学习）
3. knowledgePoints: 提取笔记中所有的知识点，内容中有多少知识点就汇总多少，不允许改变客观事实数量，一个不许少，每个知识点必须包含：
   - name: 知识点名称，使用专业术语，不超过12个字，要精准概括概念
   - description: 详细解释（80-200字），包含定义、核心内容、应用场景
   - domain: 所属学科领域

笔记内容如下：
"""
${fullContent}
"""

请严格按以下 JSON 格式返回，不要包含任何其他文字，不要加 markdown 代码块：
{
  "summary": "...",
  "tags": ["标签1", "标签2"],
  "knowledgePoints": [
    { "name": "...", "description": "...", "domain": "..." }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    const knowledgePoints = (parsed.knowledgePoints || [])
      .filter((kp: any) => {
        const name = String(kp.name || '').trim();
        const desc = String(kp.description || '').trim();
        // 只过滤掉纯元信息条目（无实质内容），保留有实际描述的知识点
        const metaOnlyPatterns = ['目录', '页码', '参考文献'];
        const isMetaOnly = metaOnlyPatterns.some((p) => name === p);
        const hasContent = name.length >= 2 && desc.length >= 10;
        return !isMetaOnly && hasContent;
      })
      .map((kp: any) => ({
        name: String(kp.name || '核心概念').slice(0, 50),
        description: String(kp.description || '').slice(0, 800),
        domain: String(kp.domain || '通用').slice(0, 50),
        mastery: 0,
      }));

    const summary = String(parsed.summary || content.slice(0, 150)).slice(0, 500);
    const tags = (parsed.tags || [])
      .map(String)
      .filter((t: string) => t.length > 0 && t.length < 20)
      .slice(0, 10);

    if (knowledgePoints.length === 0) {
      console.warn('[AI] LLM returned no valid knowledge points, falling back');
      return heuristicAnalyze(content);
    }

    console.log(`[AI Analysis] Single-shot: extracted ${knowledgePoints.length} knowledge points from ${content.length} chars of text${imageAnalysis ? ` + ${imageAnalysis.length} chars of image analysis` : ''}`);
    return { summary, tags, knowledgePoints };
  } catch (err) {
    console.error('[AI] LLM analyze failed:', err);
    return heuristicAnalyze(content);
  }
}

// Map-Reduce 分段提取（超长文档）
async function analyzeNoteMapReduce(
  content: string,
  imageAnalysis: string
): Promise<{
  summary: string;
  tags: string[];
  knowledgePoints: Omit<KnowledgePoint, 'id' | 'noteId'>[];
}> {
  const chunks = splitIntoChunks(content, 30000);
  console.log(`[AI] Document split into ${chunks.length} chunks`);

  // Map 阶段：每个 chunk 独立提取
  const chunkResults = await Promise.all(
    chunks.map((chunk, idx) => extractKnowledgeFromChunk(chunk, idx + 1, chunks.length))
  );

  // Reduce 阶段：合并结果
  const allPoints: Omit<KnowledgePoint, 'id' | 'noteId'>[] = [];
  const allTags = new Set<string>();
  const summaries: string[] = [];

  for (const result of chunkResults) {
    for (const kp of result.knowledgePoints) {
        // 去重：相似度高的跳过（阈值 0.75 避免误删不同知识点）
        const lowerName = kp.name.toLowerCase();
        let dup = false;
        for (const existing of allPoints) {
          if (similarity(existing.name.toLowerCase(), lowerName) > 0.75) {
            dup = true;
            break;
          }
        }
        if (!dup) allPoints.push(kp);
      }
    result.tags.forEach((t) => allTags.add(t));
    if (result.summary) summaries.push(result.summary);
  }

  // 图片分析的知识点也合并进来
  if (imageAnalysis) {
    try {
      const imageResult = await extractKnowledgeFromChunk(
        `[文档图片内容分析]\n${imageAnalysis}`,
        0,
        chunks.length,
        true
      );
      for (const kp of imageResult.knowledgePoints) {
        const lowerName = kp.name.toLowerCase();
        let dup = false;
        for (const existing of allPoints) {
          if (similarity(existing.name.toLowerCase(), lowerName) > 0.75) {
            dup = true;
            break;
          }
        }
        if (!dup) allPoints.push(kp);
      }
      imageResult.tags.forEach((t) => allTags.add(t));
    } catch (e) {
      console.warn('[AI] Image analysis chunk failed:', e);
    }
  }

  // 生成总摘要
  const combinedSummary = summaries.length > 0
    ? summaries.join(' ').slice(0, 400)
    : content.slice(0, 150);

  console.log(`[AI Analysis] Map-Reduce: extracted ${allPoints.length} knowledge points from ${content.length} chars across ${chunks.length} chunks`);
  return {
    summary: combinedSummary,
    tags: Array.from(allTags).slice(0, 10),
    knowledgePoints: allPoints,
  };
}

function splitIntoChunks(content: string, maxChunkSize: number): string[] {
  // 优先按章节标题分割（## 或 第X章/X节 或 数字标题）
  const chapterRegex = /\n(?=\s*(?:#{1,3}\s+|第[一二三四五六七八九十百零\d]+[章节]|\d+[.．、]\s*[^\n]{2,30}\n))/g;
  const rawParts = content.split(chapterRegex).filter((p) => p.trim().length > 0);

  const chunks: string[] = [];
  let current = '';

  for (const part of rawParts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (current.length + trimmed.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current += '\n\n' + trimmed;
    }
  }

  if (current.trim()) chunks.push(current.trim());

  // 如果没有按标题分割成功，直接按长度硬切
  if (chunks.length === 0) {
    for (let i = 0; i < content.length; i += maxChunkSize) {
      chunks.push(content.slice(i, i + maxChunkSize));
    }
  }

  return chunks;
}

async function extractKnowledgeFromChunk(
  chunk: string,
  idx: number,
  total: number,
  isImageChunk = false
): Promise<{ summary: string; tags: string[]; knowledgePoints: Omit<KnowledgePoint, 'id' | 'noteId'>[] }> {
  const prefix = isImageChunk ? '[图片分析]' : `[第${idx}/${total}段]`;
  console.log(`[AI] Extracting from chunk ${prefix}, length: ${chunk.length}`);

  const systemPrompt = `你是一位资深的教育内容分析师。请从学习笔记片段中提取有价值的知识点。
要求：
1. 只提取该片段中的知识点，不要编造
2. 知识点命名使用专业术语，不超过12个字
3. description 包含定义、核心内容、应用场景（80-200字）
4. 输出严格 JSON，不要 markdown 代码块`;

  const userPrompt = `请分析以下笔记片段，提取所有知识点。

片段内容：
"""
${chunk}
"""

请严格按以下 JSON 格式返回：
{
  "summary": "用一句话概括该片段内容",
  "tags": ["领域标签1", "领域标签2"],
  "knowledgePoints": [
    { "name": "...", "description": "...", "domain": "..." }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);

    const knowledgePoints = (parsed.knowledgePoints || [])
      .filter((kp: any) => {
        const name = String(kp.name || '').trim();
        const desc = String(kp.description || '').trim();
        // 只过滤掉纯元信息条目（无实质内容），保留有实际描述的知识点
        const metaOnlyPatterns = ['目录', '页码', '参考文献'];
        const isMetaOnly = metaOnlyPatterns.some((p) => name === p);
        const hasContent = name.length >= 2 && desc.length >= 10;
        return !isMetaOnly && hasContent;
      })
      .map((kp: any) => ({
        name: String(kp.name || '核心概念').slice(0, 50),
        description: String(kp.description || '').slice(0, 800),
        domain: String(kp.domain || '通用').slice(0, 50),
        mastery: 0,
      }));

    return {
      summary: String(parsed.summary || '').slice(0, 200),
      tags: (parsed.tags || []).map(String).filter((t: string) => t.length > 0 && t.length < 20),
      knowledgePoints,
    };
  } catch (err) {
    console.error(`[AI] Chunk ${prefix} extraction failed:`, err);
    return { summary: '', tags: [], knowledgePoints: [] };
  }
}

export async function generateQuestions(
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null }[],
  count = 5,
  questionType: 'choice' | 'fill' = 'choice'
): Promise<Omit<Question, 'id' | 'knowledgePointId'>[]> {
  if (!llmEnabled || !openai || knowledgePoints.length === 0) {
    return questionType === 'fill'
      ? heuristicGenerateFillQuestions(knowledgePoints, count)
      : heuristicGenerateQuestions(knowledgePoints, count);
  }

  const selected = knowledgePoints.slice(0, Math.min(count, knowledgePoints.length));

  if (questionType === 'fill') {
    return generateFillQuestionsLLM(selected, count);
  }

  const systemPrompt = `你是一位资深的教育命题专家，擅长设计高质量的学科测试题。你的题目考察的是理解深度而非简单记忆。`;

  const userPrompt = `请基于以下知识点，设计 ${selected.length} 道单项选择题（每题4个选项）。

出题要求（必须严格遵守）：
1. 每道题目要设置具体场景或案例，用实际应用情境考察理解，禁止出干巴巴的定义题
2. 题干要完整自包含，考生只看题干和选项就能答题
3. 错误选项必须是"看似合理但实际错误"的常见误解，每个错误选项对应一种典型错误理解
4. 正确答案和错误选项在文字长度、专业程度上要相近，不能通过排除法轻易猜出
5. 解析必须详细说明：为什么正确选项对，以及每个错误选项分别错在哪里

知识点列表：
${selected.map((kp, i) => `【${i + 1}】${kp.name}（${kp.domain || '通用'}）
描述：${kp.description || '无详细描述'}`).join('\n\n')}

请严格按以下 JSON 格式返回，不要包含任何其他文字，不要加 markdown 代码块：
{
  "questions": [
    {
      "questionText": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "explanation": "...",
      "domain": "..."
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed.questions || [];

    const questions = items.map((q: any, idx: number) => {
      let options = (q.options || []).map(String).slice(0, 4);
      // 确保选项有A/B/C/D前缀
      let normalizedOptions = options.map((opt: string, i: number) => {
        const prefix = `${String.fromCharCode(65 + i)}. `;
        return opt.startsWith(`${String.fromCharCode(65 + i)}.`) || opt.startsWith(`${String.fromCharCode(65 + i)} `)
          ? opt
          : prefix + opt;
      });

      let correctAnswer = String(q.correctAnswer || 'A').toUpperCase().replace(/^([A-D])\.?\s*/, '$1');

      // 随机打乱选项顺序，避免LLM总是将正确答案放在固定位置
      const shuffled = shuffleOptions(normalizedOptions, correctAnswer);
      normalizedOptions = shuffled.options;
      correctAnswer = shuffled.correctAnswer;

      return {
        questionText: String(q.questionText || `关于"${selected[idx]?.name}"，以下哪项正确？`),
        options: normalizedOptions,
        correctAnswer: correctAnswer,
        explanation: String(q.explanation || selected[idx]?.description || ''),
        domain: String(q.domain || selected[idx]?.domain || '通用'),
      };
    });

    // 过滤无效题目
    return questions.filter((q: any) => q.questionText.length > 10 && q.options.length >= 2);
  } catch (err) {
    console.error('[AI] LLM generate questions failed:', err);
    return heuristicGenerateQuestions(knowledgePoints, count);
  }
}

// ====== 启发式降级方案（无 LLM 或 LLM 失败时使用）======

function heuristicAnalyze(content: string): {
  summary: string;
  tags: string[];
  knowledgePoints: Omit<KnowledgePoint, 'id' | 'noteId'>[];
} {
  // 清洗文本
  const cleaned = content
    .replace(/[\r\n]+/g, '\n')
    .replace(/\s+/g, ' ')
    .trim();

  // 尝试提取列表项（1. 2. 3. 或 - * 开头）
  const listItemRegex = /(?:^|\n)[\s]*(?:[-*•]|\d+[.．、]|[(]?\d+[)]?)[\s]*([^\n]{10,300})/gm;
  const listItems: string[] = [];
  let m;
  while ((m = listItemRegex.exec(cleaned)) !== null) {
    listItems.push(m[1].trim());
  }

  // 尝试按句子分割（保留更长的句子）
  const sentences = cleaned
    .replace(/([。！？.!?])\s+/g, '$1\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length >= 10 && s.length <= 400);

  // 尝试按段落分割（双换行或标题后的大段文字）
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 30 && p.length <= 500);

  // 优先使用列表项，其次是段落，最后是句子
  let candidates: string[];
  if (listItems.length >= 3) {
    candidates = listItems;
  } else if (paragraphs.length >= 3) {
    candidates = paragraphs;
  } else {
    candidates = sentences;
  }

  // 基于词频-位置加权提取关键短语（简单 TF-IDF 替代方案）
  candidates = scoreAndRankCandidates(candidates).map((c) => c.text);

  // 去重并选取有意义的条目
  const seen = new Set<string>();
  const points: Omit<KnowledgePoint, 'id' | 'noteId'>[] = [];

  for (const text of candidates) {
    const lower = text.toLowerCase();
    // 跳过无意义的句子
    if (
      /^(本章|本节|本文|本课|我们|下面|接下来|首先|其次|最后|总之|综上所述)/.test(text) ||
      /(介绍了|讲述了|讨论了|分析了|本章小结|课后习题)/.test(text)
    ) {
      continue;
    }

    // 去重：相似度高的跳过（阈值 0.75 避免误删不同知识点）
    let dup = false;
    for (const s of seen) {
      if (similarity(s, lower) > 0.75) {
        dup = true;
        break;
      }
    }
    if (dup) continue;
    seen.add(lower);

    // 提取名称：优先取前半部分，到第一个标点为止
    let name = text.split(/[：:，,。；;]/)[0].trim();
    if (name.length > 15) name = name.slice(0, 15) + '…';
    if (name.length < 2) name = text.slice(0, 12) + (text.length > 12 ? '…' : '');

    points.push({
      name,
      description: text,
      domain: guessDomains(text)[0] || '通用',
      mastery: 0,
    });
  }

  if (points.length === 0) {
    // 完全无法提取时，按段落取前5个
    const fallbackParagraphs = cleaned.split('\n').filter((p) => p.trim().length > 30);
    for (const p of fallbackParagraphs.slice(0, 5)) {
      points.push({
        name: p.slice(0, 12) + (p.length > 12 ? '…' : ''),
        description: p,
        domain: guessDomains(p)[0] || '通用',
        mastery: 0,
      });
    }
  }

  const summary = cleaned.slice(0, 200) + (cleaned.length > 200 ? '…' : '');
  const allDomains = points.flatMap((p) => guessDomains(p.description));
  const tags = Array.from(new Set(allDomains)).slice(0, 5);
  if (tags.length === 0) tags.push('通用');

  console.log(`[AI] Heuristic analysis: extracted ${points.length} knowledge points from ${content.length} chars`);
  return { summary, tags, knowledgePoints: points };
}

// 基于词频和位置对候选条目进行排序（越靠前、专业术语越多的分数越高）
function scoreAndRankCandidates(candidates: string[]): { text: string; score: number }[] {
  const scored = candidates.map((text, idx) => {
    let score = 0;
    // 位置权重：越靠前的越重要
    score += Math.max(0, 100 - idx * 5);
    // 长度权重：适中长度得分高
    score += text.length >= 50 && text.length <= 200 ? 30 : 10;
    // 专业术语权重
    const termMatches = (text.match(/[\u4e00-\u9fa5]{2,8}(?:算法|定理|定律|原理|模型|结构|机制|策略|方法|技术)/g) || []).length;
    score += termMatches * 20;
    // 包含定义性表述
    if (/是[一种个类种项]|定义为|指[的是]|用于|作用[在于是]|功能[在于是]/.test(text)) {
      score += 15;
    }
    return { text, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function heuristicGenerateQuestions(
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null }[],
  count = 5
): Omit<Question, 'id' | 'knowledgePointId'>[] {
  const questions: Omit<Question, 'id' | 'knowledgePointId'>[] = [];
  const shuffled = [...knowledgePoints].sort(() => Math.random() - 0.5);
  const allNames = knowledgePoints.map((kp) => kp.name);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const kp = shuffled[i];
    const distractors = generateDistractors(kp.name, allNames);
    const correctIndex = Math.floor(Math.random() * 4);
    const options: string[] = [];
    let optIdx = 0;
    for (let j = 0; j < 4; j++) {
      if (j === correctIndex) {
        options.push(`${String.fromCharCode(65 + j)}. ${kp.name}`);
      } else {
        options.push(`${String.fromCharCode(65 + j)}. ${distractors[optIdx++] || '其他概念'}`);
      }
    }

    questions.push({
      questionText: `关于"${kp.name}"，以下哪项描述最准确？`,
      options,
      correctAnswer: String.fromCharCode(65 + correctIndex),
      explanation: kp.description || `${kp.name}是一个重要的知识点。`,
      domain: kp.domain,
    });
  }

  return questions;
}

// ====== 简答题生成（LLM）======

async function generateFillQuestionsLLM(
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null }[],
  count = 5
): Promise<Omit<Question, 'id' | 'knowledgePointId'>[]> {
  const systemPrompt = `你是一位资深的教育命题专家，擅长设计高质量的简答题。你的题目考察学生对知识点的深度理解和表达能力。`;

  const userPrompt = `请基于以下知识点，设计 ${Math.min(count, knowledgePoints.length)} 道简答题。

出题要求（必须严格遵守）：
1. 每道题目要引导学生进行分析和阐述，不能只是背诵定义
2. 问题要清晰具体，有明确的答题方向
3. 标准答案要完整、准确，包含核心要点
4. 解析要说明答题要点和评分标准
5. options 字段存放答题提示（2-3个答题要点提示，帮助学生组织思路）

知识点列表：
${knowledgePoints.map((kp, i) => `【${i + 1}】${kp.name}（${kp.domain || '通用'}）
描述：${kp.description || '无详细描述'}`).join('\n\n')}

请严格按以下 JSON 格式返回，不要包含任何其他文字，不要加 markdown 代码块：
{
  "questions": [
    {
      "questionText": "...",
      "options": ["提示1：...", "提示2：...", "提示3：..."],
      "correctAnswer": "标准答案内容...",
      "explanation": "评分标准：包含以下要点即得满分...",
      "domain": "..."
    }
  ]
}`;

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '[]';
    const parsed = JSON.parse(raw);
    const items = Array.isArray(parsed) ? parsed : parsed.questions || [];

    const questions = items.map((q: any, idx: number) => ({
      questionText: String(q.questionText || `请阐述"${knowledgePoints[idx]?.name}"的核心内容。`),
      options: (q.options || []).map(String).slice(0, 3),
      correctAnswer: String(q.correctAnswer || knowledgePoints[idx]?.description || ''),  
      explanation: String(q.explanation || '请参考标准答案进行核对。'),
      domain: String(q.domain || knowledgePoints[idx]?.domain || '通用'),
    }));

    return questions.filter((q: any) => q.questionText.length > 10);
  } catch (err) {
    console.error('[AI] LLM generate fill questions failed:', err);
    return heuristicGenerateFillQuestions(knowledgePoints, count);
  }
}

// ====== 简答题生成（启发式降级）======

function heuristicGenerateFillQuestions(
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null }[],
  count = 5
): Omit<Question, 'id' | 'knowledgePointId'>[] {
  const questions: Omit<Question, 'id' | 'knowledgePointId'>[] = [];
  const shuffled = [...knowledgePoints].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const kp = shuffled[i];
    questions.push({
      questionText: `请阐述"${kp.name}"的定义、核心内容及其在实际中的应用。`,
      options: ['说明定义', '分析核心内容', '举例应用场景'],
      correctAnswer: kp.description || `${kp.name}是一个重要的知识点。`,
      explanation: '答题应包含定义、核心内容和应用三个方面的阐述。',
      domain: kp.domain,
    });
  }

  return questions;
}

function guessDomains(text: string): string[] {
  const domains: Record<string, string[]> = {
    经济学: ['经济', '市场', '供需', '成本', '价格', '货币', '通货膨胀', '边际', '利率', '财政', 'GDP', '贸易'],
    计算机: ['算法', '数据', '程序', '代码', '网络', '软件', '系统', '数据库', '编程', '接口', '缓存', '并发', '操作系统', '进程', '线程'],
    管理学: ['管理', '组织', '领导', '战略', '绩效', '团队', '决策', '运营', '人力资源', '企业文化'],
    数学: ['函数', '方程', '概率', '统计', '几何', '微积分', '线性代数', '矩阵', '导数'],
    物理学: ['力', '能量', '运动', '电磁', '量子', '热力学', '光学', '相对论'],
    语言学: ['语法', '语义', '词汇', '修辞', '方言', '语音', '句法'],
    心理学: ['认知', '行为', '情绪', '人格', '动机', '记忆', '学习', '社会心理'],
    医学: ['病理', '生理', '解剖', '诊断', '治疗', '药物', '临床', '免疫'],
  };

  const scores = new Map<string, number>();
  for (const [domain, keywords] of Object.entries(domains)) {
    const count = keywords.filter((k) => text.includes(k)).length;
    if (count > 0) scores.set(domain, count);
  }

  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  // 返回得分 > 0 的所有领域，最多3个
  return sorted.length > 0 ? sorted.slice(0, 3).map(([d]) => d) : ['通用'];
}

/**
 * 随机打乱选择题选项顺序，并同步更新 correctAnswer
 */
function shuffleOptions(options: string[], correctAnswer: string): { options: string[]; correctAnswer: string } {
  // 解析每个选项的内容（去掉 A./B./C./D. 前缀），并标记哪个是正确答案
  const parsed = options.map((opt, i) => {
    const currentLetter = String.fromCharCode(65 + i);
    const content = opt.replace(/^[A-D][.．、]?\s*/, '');
    return { content, isCorrect: currentLetter === correctAnswer };
  });

  // Fisher-Yates 洗牌
  for (let i = parsed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parsed[i], parsed[j]] = [parsed[j], parsed[i]];
  }

  const newCorrectIndex = parsed.findIndex((p) => p.isCorrect);
  const newOptions = parsed.map((p, i) => `${String.fromCharCode(65 + i)}. ${p.content}`);
  const newCorrectAnswer = newCorrectIndex >= 0 ? String.fromCharCode(65 + newCorrectIndex) : correctAnswer;

  return { options: newOptions, correctAnswer: newCorrectAnswer };
}

function generateDistractors(correct: string, allKnowledgePoints?: string[]): string[] {
  // 优先从同批次知识点中交叉抽取干扰项，更贴合文档内容
  if (allKnowledgePoints && allKnowledgePoints.length >= 4) {
    return allKnowledgePoints
      .filter((p) => p !== correct)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }

  // 兜底：使用通用池子
  const pool = [
    '机会成本', '沉没成本', '边际效应', '供需平衡',
    '完全竞争', '垄断市场', '需求弹性', '生产函数',
    '二叉树遍历', '动态规划', '贪心算法', '深度优先搜索',
    'SWOT分析', '波特五力', '马斯洛需求', '蓝海战略',
  ];
  return pool.filter((p) => p !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
}

function similarity(a: string, b: string): number {
  const setA = new Set(a.split(''));
  const setB = new Set(b.split(''));
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}
