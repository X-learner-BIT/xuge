import type { KnowledgePoint, Question } from '../types.js';

// 模拟 AI 分析：提取知识点
export async function analyzeNote(content: string): Promise<{
  summary: string;
  tags: string[];
  knowledgePoints: Omit<KnowledgePoint, 'id' | 'noteId'>[];
}> {
  // 简单启发式提取（实际项目应调用 LLM API）
  const sentences = content
    .replace(/[。！？.!?]/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 10 && s.length < 200);

  const points: Omit<KnowledgePoint, 'id' | 'noteId'>[] = sentences.slice(0, 8).map((text, i) => ({
    name: text.slice(0, 20) + (text.length > 20 ? '…' : ''),
    description: text,
    domain: guessDomain(text),
    mastery: 0,
  }));

  if (points.length === 0) {
    points.push({
      name: '核心概念',
      description: content.slice(0, 100),
      domain: '通用',
      mastery: 0,
    });
  }

  const summary = content.slice(0, 150) + (content.length > 150 ? '…' : '');
  const tags = Array.from(new Set(points.map((p) => p.domain).filter(Boolean))) as string[];

  return { summary, tags, knowledgePoints: points };
}

// 模拟 AI 出题
export async function generateQuestions(
  knowledgePoints: { id: string; name: string; description: string | null; domain: string | null }[],
  count = 5
): Promise<Omit<Question, 'id' | 'knowledgePointId'>[]> {
  const questions: Omit<Question, 'id' | 'knowledgePointId'>[] = [];
  const shuffled = [...knowledgePoints].sort(() => Math.random() - 0.5);

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const kp = shuffled[i];
    const distractors = generateDistractors(kp.name);
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

function guessDomain(text: string): string {
  const domains: Record<string, string[]> = {
    经济学: ['经济', '市场', '供需', '成本', '价格', '货币', '通货膨胀', '边际'],
    计算机: ['算法', '数据', '程序', '代码', '网络', '软件', '系统', '数据库'],
    管理学: ['管理', '组织', '领导', '战略', '绩效', '团队', '决策'],
    数学: ['函数', '方程', '概率', '统计', '几何', '微积分'],
  };
  for (const [domain, keywords] of Object.entries(domains)) {
    if (keywords.some((k) => text.includes(k))) return domain;
  }
  return '通用';
}

function generateDistractors(correct: string): string[] {
  const pool = [
    '机会成本', '沉没成本', '边际效应', '供需平衡',
    '完全竞争', '垄断市场', '需求弹性', '生产函数',
    '二叉树遍历', '动态规划', '贪心算法', '深度优先搜索',
    'SWOT分析', '波特五力', '马斯洛需求', '蓝海战略',
  ];
  return pool.filter((p) => p !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
}
