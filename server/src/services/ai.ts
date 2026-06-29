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

  const systemPrompt = `你是一位笔记内容提取助手。你的唯一任务是从用户提供的笔记原文中，逐条提取笔记中已经明确写出的内容。

在提取之前，你必须先判断笔记的整体内容类型，然后按对应类型的格式进行提取。绝对不能用一种统一的格式去硬套所有笔记。

铁律：
1. 绝对忠于原文：你只能提取笔记中**实际出现**的内容，禁止添加、扩展、改编、概括任何笔记中没有的信息。
2. 禁止自我发挥：description 必须基于原文中的具体表述进行整理，不能加入原文没有的应用场景、个人评价、延伸解释。
3. 禁止重新定义：如果笔记中对某个概念有自己的定义和表述，你必须使用笔记中的原意，不能用你记忆中的通用定义去替换。
4. 逐条提取：笔记中提到了多少个条目，就必须提取多少个，一个不能少，一个不能多。
5. 不要提取目录、页码、标题层级、"本章介绍..."等元信息。
6. name 尽量使用笔记原文中的叫法；如果原文没有明确名称，再使用简洁的概括。
7. domain 根据笔记内容的学科属性填写，如原文未明示可写"通用"。
8. 每条知识点必须标注 type，且 type 必须根据内容真实属性判断，不能乱填。

输出格式必须是严格的 JSON，不要有任何 markdown 代码块标记或其他文字。`;

  const userPrompt = `请对以下笔记内容进行提取。

【第一步：判断笔记类型】
先判断这篇笔记属于哪种内容类型：
- "question_bank"（题库/试卷）：包含大量题干、选项（A/B/C/D）、答案、解析。
- "vocabulary"（词汇表/单词表）：大量单词/短语 + 中文释义/翻译/词性，如 "apple 苹果 n."。
- "formula_sheet"（公式表）：大量数学/物理/化学公式、定理、表达式，如 "F=ma"。
- "concept_notes"（概念笔记）：大量术语定义、概念解释、分类、特征描述。
- "mixed"（混合类型）：包含上述多种类型内容。

【第二步：按类型提取】
严格依据笔记原文提取所有条目。笔记中写了什么，你就提取什么；笔记没写的，你一句都不许编。

提取格式要求（必须严格遵守）：

1. 如果笔记是 "question_bank"（题库）：
   - name: 题目题干（保留序号，如 "1. 以下哪项..."），不超过30字。
   - description: 必须包含完整选项（A/B/C/D）+ 正确答案 + 解析（如果原文有）。
   - type: "question"

2. 如果笔记是 "vocabulary"（词汇表）：
   - name: 单词/短语本身（如 "apple"），不超过20字。
   - description: 必须包含中文释义/翻译 + 词性（如果原文有）+ 用法/搭配（如果原文有）。禁止写该单词指代的外部事物。
   - type: "vocabulary"

3. 如果笔记是 "formula_sheet"（公式表）：
   - name: 公式名称或表达式（如 "牛顿第二定律 F=ma"），不超过20字。
   - description: 必须包含公式表达式 + 每个变量的含义 + 适用条件 + 单位（如果原文有）。禁止出计算例题。
   - type: "formula"

4. 如果笔记是 "concept_notes"（概念笔记）：
   - name: 概念/术语名称（如 "光合作用"），不超过15字。
   - description: 必须包含定义 + 核心特征 + 分类/适用条件（如果原文有）。禁止写应用场景或具体例子。
   - type: "concept"

5. 如果笔记是 "mixed"（混合）：
   - 按每个条目的真实类型分别标注 type，不要统一填一种。

通用字段：
   - domain: 所属学科领域。
   - type: 必须是 "question" | "vocabulary" | "formula" | "concept" | "theorem" | "method" | "process" 之一，根据内容真实属性选择。

要求：
1. summary: 仅用1-2句话客观描述笔记涉及的主题范围。
2. tags: 根据笔记内容提取2-5个学科/领域标签。
3. knowledgePoints: 逐条提取，每条都必须有正确的 type。

笔记原文如下（请严格基于以下内容提取，禁止引用外部知识）：
"""
${fullContent}
"""

请严格按以下 JSON 格式返回，不要包含任何其他文字，不要加 markdown 代码块：
{
  "summary": "...",
  "tags": ["标签1", "标签2"],
  "knowledgePoints": [
    { "name": "...", "description": "...", "domain": "...", "type": "..." }
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
        type: String(kp.type || 'concept').slice(0, 20),
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

  const systemPrompt = `你是一位笔记内容提取助手。你的唯一任务是从提供的笔记片段中，逐条提取片段中已经明确写出的内容。

在提取之前，你必须先判断该片段的内容类型，然后按对应类型的格式进行提取。绝对不能用一种统一的格式去硬套所有内容。

铁律：
1. 绝对忠于原文：你只能提取片段中**实际出现**的内容，禁止添加、扩展、改编、概括任何片段中没有的信息。
2. 禁止自我发挥：description 必须基于片段中的具体表述进行整理，不能加入片段没有的应用场景、个人评价、延伸解释。
3. 禁止重新定义：如果片段中对某个概念有自己的定义和表述，你必须使用片段中的原意，不能用你记忆中的通用定义去替换。
4. 逐条提取：片段中提到了多少个条目，就必须提取多少个，一个不能少，一个不能多。
5. name 尽量使用片段原文中的叫法；如果原文没有明确名称，再使用简洁的概括。
6. 不要提取目录、页码、标题层级、"本章介绍..."等元信息。
7. 每条知识点必须标注 type，且 type 必须根据内容真实属性判断。
8. 输出严格 JSON，不要 markdown 代码块。`;

  const userPrompt = `请对以下笔记片段进行提取。

【第一步：判断片段类型】
先判断该片段属于哪种内容类型：
- "question_bank"（题库/试卷）：包含题干、选项（A/B/C/D）、答案、解析。
- "vocabulary"（词汇表）：单词/短语 + 中文释义/翻译/词性。
- "formula_sheet"（公式表）：数学/物理/化学公式、定理、表达式。
- "concept_notes"（概念笔记）：术语定义、概念解释、分类、特征描述。
- "mixed"（混合类型）：包含上述多种类型内容。

【第二步：按类型提取】
严格依据片段原文提取所有条目。片段中写了什么，你就提取什么；片段没写的，你一句都不许编。

提取格式要求：

1. 如果片段是 "question_bank"（题库）：
   - name: 题目题干（保留序号），不超过30字。
   - description: 必须包含完整选项（A/B/C/D）+ 正确答案 + 解析（如果原文有）。
   - type: "question"

2. 如果片段是 "vocabulary"（词汇表）：
   - name: 单词/短语本身，不超过20字。
   - description: 必须包含中文释义/翻译 + 词性（如果原文有）+ 用法/搭配（如果原文有）。禁止写该单词指代的外部事物。
   - type: "vocabulary"

3. 如果片段是 "formula_sheet"（公式表）：
   - name: 公式名称或表达式，不超过20字。
   - description: 必须包含公式表达式 + 每个变量的含义 + 适用条件 + 单位（如果原文有）。
   - type: "formula"

4. 如果片段是 "concept_notes"（概念笔记）：
   - name: 概念/术语名称，不超过15字。
   - description: 必须包含定义 + 核心特征 + 分类/适用条件（如果原文有）。禁止写应用场景或具体例子。
   - type: "concept"

5. 如果片段是 "mixed"（混合）：
   - 按每个条目的真实类型分别标注 type。

通用字段：
   - domain: 所属学科领域。
   - type: 必须是 "question" | "vocabulary" | "formula" | "concept" | "theorem" | "method" | "process" 之一。

要求：
1. summary: 仅用1句话客观描述该片段涉及的主题范围。
2. tags: 根据片段内容提取2-5个学科/领域标签。
3. knowledgePoints: 逐条提取，每条都必须有正确的 type。

片段原文如下（请严格基于以下内容提取，禁止引用外部知识）：
"""
${chunk}
"""

请严格按以下 JSON 格式返回：
{
  "summary": "...",
  "tags": ["标签1", "标签2"],
  "knowledgePoints": [
    { "name": "...", "description": "...", "domain": "...", "type": "..." }
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
        type: String(kp.type || 'concept').slice(0, 20),
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

/**
 * 检测知识点的 description 是否包含题目格式（A/B/C/D 选项 + 答案）
 */
function isQuestionFormat(kp: { name: string; description: string | null }): boolean {
  if (!kp.description) return false;
  const desc = kp.description;
  // 检测是否包含 A/B/C/D 选项标记
  const hasOptions = /[A-D][.．、)）]/.test(desc);
  // 检测是否包含答案标记
  const hasAnswer = /答案[:：]/.test(desc) || /正确[:：]/.test(desc) || /解析[:：]/.test(desc);
  // name 像题干的特征
  const nameLikeQuestion = /[?？]$/.test(kp.name) || /^\d+[.．、]/.test(kp.name);
  return hasOptions && (hasAnswer || nameLikeQuestion);
}

/**
 * 从知识点的 description 中解析出原题（选项、正确答案、解析）
 */
function parseQuestionFromKnowledgePoint(
  kp: { name: string; description: string | null; domain: string | null }
): Omit<Question, 'id' | 'knowledgePointId'> | null {
  if (!kp.description) return null;
  const desc = kp.description;

  // 提取选项：匹配 A. xxx B. xxx C. xxx D. xxx
  const optionRegex = /([A-D])[.．、)\s]\s*([^\n]+)/g;
  const options: string[] = [];
  let match;
  while ((match = optionRegex.exec(desc)) !== null) {
    const letter = match[1];
    const text = match[2].trim();
    // 避免重复提取
    if (!options.some((o) => o.startsWith(`${letter}.`))) {
      options.push(`${letter}. ${text}`);
    }
  }

  if (options.length < 2) return null;

  // 提取正确答案
  let correctAnswer = 'A';
  const answerMatch = desc.match(/答案[:：]\s*([A-D](?:[,，][A-D])*)/);
  if (answerMatch) {
    correctAnswer = answerMatch[1].replace(/[,，]/g, ',').trim();
  } else {
    // 尝试匹配 "正确答案"
    const correctMatch = desc.match(/正确[:：答案]\s*([A-D](?:[,，][A-D])*)/);
    if (correctMatch) {
      correctAnswer = correctMatch[1].replace(/[,，]/g, ',').trim();
    }
  }

  // 提取解析
  let explanation = '';
  const explanationMatch = desc.match(/解析[:：]([\s\S]*)/);
  if (explanationMatch) {
    explanation = explanationMatch[1].trim();
  } else {
    // 如果没有解析，用 description 去掉选项和答案后的剩余内容
    explanation = desc
      .replace(/[A-D][.．、)\s]\s*[^\n]+/g, '')
      .replace(/答案[:：]\s*[A-D](?:[,，][A-D])*/g, '')
      .replace(/正确[:：答案]\s*[A-D](?:[,，][A-D])*/g, '')
      .replace(/解析[:：][\s\S]*/g, '')
      .trim();
  }

  // 确保选项有 A/B/C/D 前缀并按顺序排列
  const sortedOptions = ['A', 'B', 'C', 'D']
    .map((letter) => options.find((o) => o.startsWith(`${letter}.`)) || `${letter}. （选项缺失）`)
    .filter((o) => !o.includes('（选项缺失）'));

  if (sortedOptions.length < 2) return null;

  return {
    questionText: kp.name,
    options: sortedOptions,
    correctAnswer,
    explanation: explanation || kp.description.slice(0, 200),
    domain: kp.domain,
  };
}

/**
 * 从笔记原文中提取与知识点相关的上下文片段
 */
function extractContextFromNote(noteContent: string, keyword: string, maxLength: number): string {
  if (!noteContent || !keyword) return '';

  // 如果笔记内容很短，直接返回全部
  if (noteContent.length <= maxLength) {
    return noteContent.trim();
  }

  // 尝试在笔记内容中查找知识点名称的位置
  const idx = noteContent.indexOf(keyword);
  if (idx === -1) {
    // 如果找不到完整名称，尝试查找前10个字符
    const shortKeyword = keyword.slice(0, Math.min(10, keyword.length));
    const shortIdx = noteContent.indexOf(shortKeyword);
    if (shortIdx === -1) {
      // 仍然找不到，返回笔记开头
      return noteContent.slice(0, maxLength).trim() + (noteContent.length > maxLength ? '...' : '');
    }
    // 提取前后上下文
    const start = Math.max(0, shortIdx - Math.floor(maxLength / 2));
    const end = Math.min(noteContent.length, shortIdx + shortKeyword.length + Math.floor(maxLength / 2));
    let context = noteContent.slice(start, end).trim();
    if (start > 0) context = '...' + context;
    if (end < noteContent.length) context = context + '...';
    return context;
  }

  // 找到了完整名称，提取前后上下文
  const half = Math.floor(maxLength / 2);
  const start = Math.max(0, idx - half);
  const end = Math.min(noteContent.length, idx + keyword.length + half);
  let context = noteContent.slice(start, end).trim();
  if (start > 0) context = '...' + context;
  if (end < noteContent.length) context = context + '...';
  return context;
}

export async function generateQuestions(
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null; note?: { title: string; contentType: string; content: string | null } | null }[],
  count = 5,
  questionType: 'choice' | 'fill' = 'choice',
  creativeMode = false
): Promise<Omit<Question, 'id' | 'knowledgePointId'>[]> {
  if (!llmEnabled || !openai || knowledgePoints.length === 0) {
    return questionType === 'fill'
      ? heuristicGenerateFillQuestions(knowledgePoints, count)
      : heuristicGenerateQuestions(knowledgePoints, count, creativeMode);
  }

  const selected = knowledgePoints.slice(0, Math.min(count, knowledgePoints.length));

  if (questionType === 'fill') {
    return generateFillQuestionsLLM(selected, count);
  }

  // 先检测哪些知识点本身就是题目格式，直接解析为原题
  const parsedQuestions: Omit<Question, 'id' | 'knowledgePointId'>[] = [];
  const needGenerate: typeof selected = [];

  for (const kp of selected) {
    if (isQuestionFormat(kp)) {
      const parsed = parseQuestionFromKnowledgePoint(kp);
      if (parsed) {
        parsedQuestions.push(parsed);
        console.log(`[Question Parser] Parsed original question from knowledge point: "${kp.name}"`);
        continue;
      }
    }
    needGenerate.push(kp);
  }

  console.log(`[Question Generation] ${parsedQuestions.length} original questions parsed, ${needGenerate.length} need LLM generation`);

  // 如果全部知识点都是原题，直接返回
  if (needGenerate.length === 0) {
    return parsedQuestions;
  }

  // 根据 creativeMode 选择提示词策略
  const systemPrompt = `你是一位知识点测试出题助手。你的唯一任务是：根据给定的知识点，设计一道只考察该知识点"自身属性"的选择题。你绝对禁止考察该知识点所指代的外部事物。`;

  const sharedExamples = `考察方向正反面示例（必须严格遵循）：

❌ 错误示例（绝对禁止）：
知识点："apple / 苹果"
题目："苹果主要产自以下哪个地区？"
选项：A. 热带  B. 温带  C. 寒带  D. 亚热带
错误原因：考察的是"苹果这种水果"的产地，而不是"apple/苹果"这个知识点本身。

✅ 正确示例（必须效仿）：
知识点："apple / 苹果"
题目："单词'apple'的中文含义是？"
选项：A. 苹果  B. 香蕉  C. 橙子  D. 葡萄
正确原因：直接考察该知识点的含义/翻译。

❌ 错误示例（绝对禁止）：
知识点："光合作用"
题目："植物进行光合作用时，主要吸收什么颜色的光？"
选项：A. 红光  B. 绿光  C. 蓝光  D. 黄光
错误原因：考察的是光合作用这个现象的具体细节，而不是"光合作用"这个概念的内涵。

✅ 正确示例（必须效仿）：
知识点："光合作用"
题目："光合作用的定义是？"
选项：A. 植物利用光能将二氧化碳和水转化为有机物并释放氧气的过程  B. ...  C. ...  D. ...
正确原因：直接考察概念的定义。

❌ 错误示例（绝对禁止）：
知识点："F=ma（牛顿第二定律）"
题目："一个质量为2kg的物体在5N的力作用下，加速度是多少？"
选项：A. 2m/s²  B. 2.5m/s²  C. 5m/s²  D. 10m/s²
错误原因：考察的是用公式计算具体数值，而不是公式本身。

✅ 正确示例（必须效仿）：
知识点："F=ma（牛顿第二定律）"
题目："牛顿第二定律 F=ma 中，字母'a'代表什么物理量？"
选项：A. 质量  B. 加速度  C. 速度  D. 力
正确原因：直接考察公式中变量的含义/公式本身的结构。`;

  const userPrompt = creativeMode
    ? `请基于以下知识点，设计 ${selected.length} 道选择题（每题4个选项）。

【最高优先级规则】考察方向铁律：
1. 每道题必须直接考察知识点的"自身属性"。知识点是什么，你就考察什么本身。
2. 绝对禁止考察该知识点所指代的外部事物或对象。
3. 你必须根据知识点的 type 来决定考察方向：
   - type="vocabulary"（词汇）：考察含义、翻译、词性、拼写、用法搭配。绝对不能考察该单词指代的外部事物。
   - type="formula"（公式）：考察表达式、变量含义、适用条件、单位。绝对不能出计算题。
   - type="concept"（概念）：考察定义、核心特征、分类、性质、适用条件。绝对不能写应用场景或具体例子。
   - type="theorem"（定理）：考察定理内容、适用条件、推导逻辑、与其他定理的关系。
   - type="method"（方法）：考察方法步骤、适用场景、核心原理、与其他方法的区别。
   - type="process"（流程）：考察流程步骤、顺序、关键节点、条件判断。
   - type="question"（题目）：这是原题，直接复用，不需要重新出题。
4. 如果设置场景，场景只能是"知识点在语言/学科中的应用"场景，绝对不能变成"知识点所指代事物的实际场景"。

${sharedExamples}

出题要求：
1. 题干要完整自包含，考生只看题干和选项就能答题
2. 错误选项必须是"看似合理但实际错误"的常见误解
3. 正确答案和错误选项在文字长度、专业程度上要相近
4. 解析必须详细说明正确选项为什么对
5. 每道题必须明确标注 answerType："single"（单选题，只有1个正确答案）或 "multiple"（多选题，有2-3个正确答案）。严禁混淆：如果 answerType="multiple"，correctAnswer 必须用逗号分隔多个字母，如 "A,C"；如果 answerType="single"，correctAnswer 只能是一个字母，如 "A"。

知识点列表（每个知识点标注了 type，并附有原文上下文，请务必参考 type 和原文来理解考察方向）：
${needGenerate.map((kp, i) => {
  const noteContent = kp.note?.content || '';
  const context = extractContextFromNote(noteContent, kp.name, 600);
  return `【${i + 1}】${kp.name}（${kp.domain || '通用'}）
类型：${kp.type || 'concept'}
描述：${kp.description || '无详细描述'}
所属笔记：${kp.note?.title || '未知笔记'}（类型：${kp.note?.contentType || 'text'}）
原文上下文：${context || '无原文内容'}`;
}).join('\n\n')}

请严格按以下 JSON 格式返回，不要包含任何其他文字，不要加 markdown 代码块：
{
  "questions": [
    {
      "questionText": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "answerType": "single",
      "explanation": "...",
      "domain": "..."
    }
  ]
}`
    : `请基于以下知识点，设计 ${selected.length} 道选择题（每题4个选项）。

【最高优先级规则】考察方向铁律：
1. 每道题必须直接考察知识点的"自身属性"。知识点是什么，你就考察什么本身。
2. 绝对禁止考察该知识点所指代的外部事物或对象。
3. 你必须根据知识点的 type 来决定考察方向：
   - type="vocabulary"（词汇）：考察含义、翻译、词性、拼写、用法搭配。绝对不能考察该单词指代的外部事物。
   - type="formula"（公式）：考察表达式、变量含义、适用条件、单位。绝对不能出计算题。
   - type="concept"（概念）：考察定义、核心特征、分类、性质、适用条件。绝对不能写应用场景或具体例子。
   - type="theorem"（定理）：考察定理内容、适用条件、推导逻辑、与其他定理的关系。
   - type="method"（方法）：考察方法步骤、适用场景、核心原理、与其他方法的区别。
   - type="process"（流程）：考察流程步骤、顺序、关键节点、条件判断。
   - type="question"（题目）：这是原题，直接复用，不需要重新出题。
4. 题目必须直接围绕知识点内容出题，禁止设置任何场景或案例，禁止出应用题。

${sharedExamples}

出题要求：
1. 题干要简洁明了，直接问该知识点的定义/含义/翻译/性质/特征/分类
2. 错误选项必须是知识点中明确提到的错误理解或易混淆概念
3. 正确答案和错误选项在文字长度、专业程度上要相近
4. 解析必须说明正确选项与知识点的对应关系
5. 每道题必须明确标注 answerType："single"（单选题，只有1个正确答案）或 "multiple"（多选题，有2-3个正确答案）。严禁混淆：如果 answerType="multiple"，correctAnswer 必须用逗号分隔多个字母，如 "A,C"；如果 answerType="single"，correctAnswer 只能是一个字母，如 "A"。

知识点列表（每个知识点标注了 type，并附有原文上下文，请务必参考 type 和原文来理解考察方向）：
${needGenerate.map((kp, i) => {
  const noteContent = kp.note?.content || '';
  const context = extractContextFromNote(noteContent, kp.name, 600);
  return `【${i + 1}】${kp.name}（${kp.domain || '通用'}）
类型：${kp.type || 'concept'}
描述：${kp.description || '无详细描述'}
所属笔记：${kp.note?.title || '未知笔记'}（类型：${kp.note?.contentType || 'text'}）
原文上下文：${context || '无原文内容'}`;
}).join('\n\n')}

请严格按以下 JSON 格式返回，不要包含任何其他文字，不要加 markdown 代码块：
{
  "questions": [
    {
      "questionText": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctAnswer": "A",
      "answerType": "single",
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
      temperature: creativeMode ? 0.3 : 0.1,
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

      // 支持多选题：correctAnswer 可能是 "A" 或 "A,C" 或 "A, C"
      const rawCorrect = String(q.correctAnswer || 'A').toUpperCase();
      const correctLetters = rawCorrect.split(/[,，]/).map((s: string) => s.trim()).filter((s: string) => /^[A-D]$/.test(s));
      let correctAnswer = correctLetters.length > 0 ? correctLetters.join(',') : 'A';

      // 解析 answerType：优先使用 LLM 返回的，如果缺失则根据 correctAnswer 推断
      let answerType = String(q.answerType || '').toLowerCase();
      if (answerType !== 'single' && answerType !== 'multiple') {
        // LLM 没有返回或返回了无效值，根据 correctAnswer 推断
        answerType = correctAnswer.includes(',') ? 'multiple' : 'single';
      }

      // 验证一致性：如果 answerType 是 multiple 但 correctAnswer 没有逗号，强制改为 single
      if (answerType === 'multiple' && !correctAnswer.includes(',')) {
        console.warn(`[Question Validation] answerType="multiple" but correctAnswer="${correctAnswer}" has no comma, forcing to single`);
        answerType = 'single';
      }
      // 验证一致性：如果 answerType 是 single 但 correctAnswer 有逗号，这是一个严重错误，保留 correctAnswer 并改为 multiple
      if (answerType === 'single' && correctAnswer.includes(',')) {
        console.warn(`[Question Validation] answerType="single" but correctAnswer="${correctAnswer}" has comma, forcing to multiple`);
        answerType = 'multiple';
      }

      // 随机打乱选项顺序，避免LLM总是将正确答案放在固定位置
      const shuffled = shuffleOptionsMulti(normalizedOptions, correctAnswer);
      normalizedOptions = shuffled.options;
      correctAnswer = shuffled.correctAnswer;

      return {
        questionText: String(q.questionText || `关于"${selected[idx]?.name}"，以下哪项正确？`),
        options: normalizedOptions,
        correctAnswer: correctAnswer,
        answerType,
        explanation: String(q.explanation || selected[idx]?.description || ''),
        domain: String(q.domain || selected[idx]?.domain || '通用'),
      };
    });

    // 过滤无效题目，并与解析出的原题合并
    const generatedQuestions = questions.filter((q: any) => q.questionText.length > 10 && q.options.length >= 2);
    const combined = [...parsedQuestions, ...generatedQuestions];
    console.log(`[Question Generation] Total questions: ${combined.length} (${parsedQuestions.length} original + ${generatedQuestions.length} generated)`);
    return combined;
  } catch (err) {
    console.error('[AI] LLM generate questions failed:', err);
    // 如果LLM失败，合并已解析的原题和启发式生成的题目
    const fallback = heuristicGenerateQuestions(needGenerate, needGenerate.length, creativeMode);
    const combined = [...parsedQuestions, ...fallback];
    return combined;
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
  const allDomains = points.flatMap((p) => guessDomains(p.description || ''));
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
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null; note?: { title: string; contentType: string; content: string | null } | null }[],
  count = 5,
  creativeMode = false
): Omit<Question, 'id' | 'knowledgePointId'>[] {
  const questions: Omit<Question, 'id' | 'knowledgePointId'>[] = [];
  const shuffled = [...knowledgePoints].sort(() => Math.random() - 0.5);
  const allNames = knowledgePoints.map((kp) => kp.name);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const kp = shuffled[i];
    const distractors = generateDistractors(kp.name, allNames);

    // 非创意模式下，30% 概率出多选题
    const isMulti = !creativeMode && Math.random() < 0.3;

    if (isMulti && distractors.length >= 2) {
      // 多选题：2个正确答案 + 2个错误选项
      const correctCount = 2;
      const correctIndices = new Set<number>();
      while (correctIndices.size < correctCount) {
        correctIndices.add(Math.floor(Math.random() * 4));
      }
      const sortedCorrect = Array.from(correctIndices).sort((a, b) => a - b);
      const options: string[] = [];
      let distractorIdx = 0;
      const correctLetters: string[] = [];
      for (let j = 0; j < 4; j++) {
        const letter = String.fromCharCode(65 + j);
        if (correctIndices.has(j)) {
          options.push(`${letter}. ${kp.name}`);
          correctLetters.push(letter);
        } else {
          options.push(`${letter}. ${distractors[distractorIdx++] || '其他概念'}`);
        }
      }
      questions.push({
        questionText: `关于"${kp.name}"，以下哪些描述是正确的？（多选）`,
        options,
        correctAnswer: correctLetters.join(','),
        explanation: kp.description || `${kp.name}是一个重要的知识点。`,
        domain: kp.domain,
      });
    } else {
      // 单选题
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
      const questionText = creativeMode
        ? `在实际应用场景中，关于"${kp.name}"的理解，以下哪项描述最准确？`
        : `关于"${kp.name}"，以下哪项描述最准确？`;
      questions.push({
        questionText,
        options,
        correctAnswer: String.fromCharCode(65 + correctIndex),
        explanation: kp.description || `${kp.name}是一个重要的知识点。`,
        domain: kp.domain,
      });
    }
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
 * 随机打乱选择题选项顺序，并同步更新 correctAnswer（单选题）
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

/**
 * 随机打乱选择题选项顺序，并同步更新 correctAnswer（支持多选题，correctAnswer 如 "A,C"）
 */
function shuffleOptionsMulti(options: string[], correctAnswer: string): { options: string[]; correctAnswer: string } {
  const correctLetters = correctAnswer.split(',').map((s) => s.trim()).filter((s) => /^[A-D]$/.test(s));

  // 解析每个选项的内容（去掉 A./B./C./D. 前缀），并标记是否是正确答案
  const parsed = options.map((opt, i) => {
    const currentLetter = String.fromCharCode(65 + i);
    const content = opt.replace(/^[A-D][.．、]?\s*/, '');
    return { content, isCorrect: correctLetters.includes(currentLetter) };
  });

  // Fisher-Yates 洗牌
  for (let i = parsed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [parsed[i], parsed[j]] = [parsed[j], parsed[i]];
  }

  const newCorrectLetters: string[] = [];
  const newOptions = parsed.map((p, i) => {
    const letter = String.fromCharCode(65 + i);
    if (p.isCorrect) newCorrectLetters.push(letter);
    return `${letter}. ${p.content}`;
  });

  return { options: newOptions, correctAnswer: newCorrectLetters.join(',') };
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
