import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始生成演示数据...\n');

  // 清空旧数据（保留表结构）
  console.log('🧹 清空旧数据...');
  await prisma.reviewRecord.deleteMany();
  await prisma.question.deleteMany();
  await prisma.knowledgePoint.deleteMany();
  await prisma.note.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ 旧数据已清空\n');

  // ====== 用户 1：小明（主展示用户） ======
  console.log('👤 创建用户：小明 (admin / 1234)');
  const user1 = await prisma.user.create({
    data: {
      email: 'xiaoming@example.com',
      phone: '13800138001',
      password: await bcrypt.hash('1234', 10),
      nickname: '小明',
      role: 'user',
    },
  });

  // ====== 笔记 1：微观经济学 ======
  console.log('📄 创建笔记：微观经济学');
  const note1 = await prisma.note.create({
    data: {
      title: '微观经济学笔记',
      contentType: 'pdf',
      content: '这是微观经济学的详细笔记内容...',
      aiSummary: '本笔记系统梳理了微观经济学的核心概念，涵盖供需理论、边际分析、市场结构等内容。',
      tags: ['经济学', '微观经济', '市场'],
      status: 'completed',
      userId: user1.id,
      knowledgePoints: {
        create: [
          { name: '供需平衡', description: '当市场上商品供给量等于需求量时的状态', domain: '经济学', mastery: 85 },
          { name: '边际效应', description: '每增加一单位消费所带来的额外满足程度', domain: '经济学', mastery: 72 },
          { name: '机会成本', description: '为了得到某种东西而放弃的其他东西中价值最高的那个', domain: '经济学', mastery: 90 },
          { name: '完全竞争市场', description: '市场上有大量买者和卖者，产品同质，信息完全', domain: '经济学', mastery: 55 },
          { name: '垄断市场', description: '市场上只有一个卖者，没有近似替代品', domain: '经济学', mastery: 38 },
          { name: '价格弹性', description: '需求量对价格变动的敏感程度', domain: '经济学', mastery: 68 },
          { name: '生产函数', description: '生产要素投入与最大产出之间的技术关系', domain: '经济学', mastery: 45 },
        ],
      },
    },
    include: { knowledgePoints: true },
  });

  // ====== 笔记 2：数据结构与算法 ======
  console.log('📄 创建笔记：数据结构与算法');
  const note2 = await prisma.note.create({
    data: {
      title: '数据结构与算法',
      contentType: 'docx',
      content: '这是数据结构与算法的详细笔记内容...',
      aiSummary: '涵盖了常用数据结构（数组、链表、树、图）及经典算法（排序、搜索、动态规划）的原理与实现。',
      tags: ['计算机', '算法', '数据结构'],
      status: 'completed',
      userId: user1.id,
      knowledgePoints: {
        create: [
          { name: '二叉树遍历', description: '前序、中序、后序遍历二叉树的方法与应用', domain: '计算机', mastery: 92 },
          { name: '动态规划', description: '将复杂问题分解为子问题并存储子问题解的算法思想', domain: '计算机', mastery: 65 },
          { name: '贪心算法', description: '每一步都选择局部最优解，期望达到全局最优', domain: '计算机', mastery: 78 },
          { name: '深度优先搜索', description: '沿着树的深度遍历节点，尽可能深地搜索分支', domain: '计算机', mastery: 82 },
          { name: '哈希表', description: '通过哈希函数将键映射到值的数据结构', domain: '计算机', mastery: 88 },
          { name: '图论基础', description: '图的表示方法、最短路径、最小生成树等', domain: '计算机', mastery: 42 },
          { name: '排序算法', description: '冒泡、快排、归并、堆排序等的原理与复杂度分析', domain: '计算机', mastery: 95 },
        ],
      },
    },
    include: { knowledgePoints: true },
  });

  // ====== 笔记 3：管理学原理 ======
  console.log('📄 创建笔记：管理学原理');
  const note3 = await prisma.note.create({
    data: {
      title: '管理学原理',
      contentType: 'text',
      content: '这是管理学原理的详细笔记内容...',
      aiSummary: '系统介绍了管理学的基本理论，包括计划、组织、领导、控制四大职能及经典管理理论。',
      tags: ['管理学', '领导力', '组织行为'],
      status: 'completed',
      userId: user1.id,
      knowledgePoints: {
        create: [
          { name: 'SWOT分析', description: '从优势、劣势、机会、威胁四个维度分析企业战略', domain: '管理学', mastery: 75 },
          { name: '波特五力', description: '分析行业竞争态势的五种力量模型', domain: '管理学', mastery: 60 },
          { name: '马斯洛需求', description: '人的需求从低到高分为五个层次', domain: '管理学', mastery: 88 },
          { name: '蓝海战略', description: '通过价值创新开辟无人竞争的新市场空间', domain: '管理学', mastery: 33 },
          { name: 'PDCA循环', description: '计划-执行-检查-行动的持续改进方法', domain: '管理学', mastery: 70 },
        ],
      },
    },
    include: { knowledgePoints: true },
  });

  // ====== 笔记 4：高等数学（分析中状态） ======
  console.log('📄 创建笔记：高等数学（分析中）');
  const note4 = await prisma.note.create({
    data: {
      title: '高等数学笔记',
      contentType: 'pdf',
      content: '这是高等数学的详细笔记内容...',
      aiSummary: null,
      tags: [],
      status: 'analyzing',
      userId: user1.id,
      knowledgePoints: {
        create: [],
      },
    },
    include: { knowledgePoints: true },
  });

  // ====== 笔记 5：大学物理 ======
  console.log('📄 创建笔记：大学物理');
  const note5 = await prisma.note.create({
    data: {
      title: '大学物理笔记',
      contentType: 'pdf',
      content: '这是大学物理的详细笔记内容...',
      aiSummary: '涵盖力学、热学、电磁学、光学等物理学基础知识。',
      tags: ['物理学', '力学', '电磁学'],
      status: 'completed',
      userId: user1.id,
      knowledgePoints: {
        create: [
          { name: '牛顿三定律', description: '惯性定律、F=ma、作用力与反作用力', domain: '物理学', mastery: 80 },
          { name: '能量守恒', description: '孤立系统总能量保持不变', domain: '物理学', mastery: 72 },
          { name: '电磁感应', description: '变化的磁场产生电场', domain: '物理学', mastery: 48 },
          { name: '热力学定律', description: '能量守恒、熵增、绝对零度不可达到', domain: '物理学', mastery: 55 },
        ],
      },
    },
    include: { knowledgePoints: true },
  });

  // ====== 用户 2：小红（展示多用户隔离） ======
  console.log('👤 创建用户：小红 (xiaohong / 1234)');
  const user2 = await prisma.user.create({
    data: {
      email: 'xiaohong@example.com',
      phone: '13800138002',
      password: await bcrypt.hash('1234', 10),
      nickname: '小红',
      role: 'user',
    },
  });

  console.log('📄 创建笔记：小红的心理学笔记');
  await prisma.note.create({
    data: {
      title: '心理学导论',
      contentType: 'docx',
      content: '心理学笔记内容...',
      aiSummary: '介绍了心理学的基本概念和研究方法。',
      tags: ['心理学', '认知'],
      status: 'completed',
      userId: user2.id,
      knowledgePoints: {
        create: [
          { name: '认知失调', description: '态度与行为不一致时产生的心理不适', domain: '心理学', mastery: 65 },
          { name: '条件反射', description: '巴甫洛夫的经典条件反射实验', domain: '心理学', mastery: 78 },
        ],
      },
    },
  });

  // ====== 生成问题和复习记录 ======
  console.log('\n📝 生成复习题目和答题记录...');

  const allPoints = [
    ...note1.knowledgePoints,
    ...note2.knowledgePoints,
    ...note3.knowledgePoints,
    ...note5.knowledgePoints,
  ];

  // 为每个知识点生成 1-2 道问题
  for (const kp of allPoints) {
    const isChoice = Math.random() > 0.3;
    const question = await prisma.question.create({
      data: {
        questionType: isChoice ? 'choice' : 'fill',
        questionText: isChoice
          ? `关于"${kp.name}"，以下哪项描述最准确？`
          : `请阐述"${kp.name}"的核心概念及其应用。`,
        options: isChoice
          ? JSON.stringify(['A. 正确描述', 'B. 错误描述一', 'C. 错误描述二', 'D. 错误描述三'])
          : JSON.stringify(['要点一', '要点二', '要点三']),
        correctAnswer: isChoice ? 'A' : (kp.description || '标准答案'),
        explanation: `本题考察对"${kp.name}"的理解。正确答案是${isChoice ? 'A' : '标准答案'}。`,
        domain: kp.domain,
        knowledgePointId: kp.id,
      },
    });

    // 生成复习记录（有的正确有的错误）
    const recordCount = Math.floor(Math.random() * 4);
    for (let i = 0; i < recordCount; i++) {
      const isCorrect = Math.random() > 0.4; // 60% 正确率
      await prisma.reviewRecord.create({
        data: {
          userId: user1.id,
          questionId: question.id,
          userAnswer: isChoice ? (isCorrect ? 'A' : 'B') : (isCorrect ? kp.description || '答案' : '错误答案'),
          isCorrect,
        },
      });
    }
  }

  console.log('✅ 题目和答题记录已生成');

  // ====== 统计 ======
  const userCount = await prisma.user.count();
  const noteCount = await prisma.note.count();
  const pointCount = await prisma.knowledgePoint.count();
  const questionCount = await prisma.question.count();
  const recordCount = await prisma.reviewRecord.count();

  console.log('\n📊 数据生成完毕！');
  console.log('─────────────────────────────');
  console.log(`  用户:      ${userCount} 位`);
  console.log(`  笔记:      ${noteCount} 篇`);
  console.log(`  知识点:    ${pointCount} 个`);
  console.log(`  题目:      ${questionCount} 道`);
  console.log(`  答题记录:  ${recordCount} 条`);
  console.log('─────────────────────────────');
  console.log('\n👤 可用账号登录测试：');
  console.log('   小明: admin / 1234');
  console.log('   小红: xiaohong@example.com / 1234');
  console.log('\n🎉 演示数据准备就绪！');
}

main()
  .catch((e) => {
    console.error('❌ 数据生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
