# 栩格 — AI 知识体检与复习助手 · 产品需求文档

> **版本：** v1.0
> **赛道：** TRAE AI 创造力大赛 · 学习工作
> **口号：** 把你的知识管起来，让遗忘有据可查
> **阶段目标：**
> - **7/3 前：** 跑通 Demo，可展示核心闭环
> - **7/10 前：** 正式上线，用户能注册使用

---

## 一、产品概述

### 1.1 一句话描述

一个基于 AI 的 Web 应用，用户上传笔记（PDF/Word/文字），AI 自动提取知识点、生成选择题、诊断薄弱环节，帮你精准复习。

### 1.2 核心价值

- **把笔记变活：** AI 理解你的笔记，不只是存储，而是提取出知识点
- **主动出题盯你复习：** 不是"你想复习才复习"，是打开应用就有题做
- **告诉你哪里弱：** 精确到"边际效应递减你只掌握了 30%"
- **上线能用：** 别人能注册、上传、复习、看到自己的弱项

### 1.3 用户画像

| 用户 | 场景 | 一句话需求 |
|------|------|-----------|
| 大学生/考研党 | 期末备考，专业课知识点多 | "上传我的笔记，AI 帮我出题复习" |
| 职场新人 | 新入行，快速学习行业知识 | "没时间自己整理，AI 搞定" |
| 考证人群（法考/CPA） | 备考周期长，需要持续巩固 | "我就想知道哪里还没掌握" |

---

## 二、技术选型

### 2.1 选型总览

| 层 | 技术 | 说明 |
|----|------|------|
| **前端** | React 18 + Vite + Tailwind CSS | 已定，不动 |
| **后端** | **待定（二选一）** | ↓ 见下方 |
| **数据库** | PostgreSQL 17 | 服务器本地运行 |
| **ORM** | Prisma | 已定，前后端统一语言 |
| **部署** | 云服务器 2核2G+ | 一台服务器全搞定 |
| **Web 服务器** | Nginx | 转发前端 + 反向代理 API |
| **进程管理** | PM2 | Node.js 后端自动重启 |
| **AI 模型** | TRAE 内置模型 | 参赛要求，调用 API |

### 2.2 后端方案（已定：NestJS）

| 项 | 选型 | 理由 |
|----|------|------|
| 框架 | **NestJS** | 前后端 TypeScript 统一，结构规范，开发效率高 |
| ORM | **Prisma** | 类型安全，NestJS 生态完美适配 |
| 认证 | **JWT + bcrypt** | 无状态认证，主流方案 |
| 文件上传 | **multer** | Express 生态标准库 |
| 文档解析 | **pdf-parse + mammoth** | PDF/Word 文本提取

---

## 三、功能清单（只做能直接拉分的）

### 第一阶段：核心Demo（6/26 → 7/3，必须跑通）

| 编号 | 功能 | 说明 | 拉分维度 |
|:----:|------|------|:--------:|
| F1 | **用户注册/登录** | 邮箱注册 + JWT 认证 | 实用性 |
| F2 | **笔记上传** | 拖拽/选择 PDF、Word、直接输入文字 | 实用性 |
| F3 | **AI 笔记分析** | 自动提取知识点、生成摘要、打分类标签 | 创新性 |
| F4 | **笔记列表+详情** | 所有笔记卡片展示，点击查看 AI 分析结果 | 完成度 |
| F5 | **Dashboard 首页** | 知识全景图雷达图 + 今日复习进度 + 薄弱提醒 | 美观度+创新性 |
| F6 | **选择题复习** | AI 出 5 道选择题，用户作答，即时反馈对错+解析 | 创新性+实用性 |
| F7 | **弱项报告** | 答题后生成报告，标出薄弱知识点 | 实用性+完成度 |

### 第二阶段：上线完善（7/3 → 7/10，按优先级做）

| 编号 | 功能 | 说明 | 优先级 |
|:----:|------|------|:----:|
| F8 | 开放问答复习 | 打字回答，AI 评分 | ⭐ 最高 |
| F9 | 复习历史记录 | 按日期查看答题记录 | ⭐ 高 |
| F10 | 错题本 | 自动收集错题，可针对性重做 | ⭐ 中 |
| F11 | 忘记密码 | 邮箱重置 | ⭐ 低 |

### 明确不做的

| 功能 | 原因 |
|------|------|
| 语音问答 | 复杂度高，非核心链路 |
| 情景应用题 | 锦上添花 |
| 复习提醒推送 | 需要邮件服务，与核心无关 |

---

## 四、用户完整流程

```
打开栩格 (域名)
  │
  ├── 未登录 → 注册/登录页面
  │
  ├── Dashboard (首页)
  │     ├── 雷达图 (知识全景，初始为空)
  │     ├── 今日复习进度条
  │     ├── 薄弱领域提醒区域
  │     └── 两个大按钮：「上传笔记」「开始复习」
  │
  ├── 上传笔记页
  │     ├── 拖拽上传区域 (PDF/Word)
  │     └── 文字输入区域 (富文本)
  │         → 上传后显示「AI 分析中…」加载动画
  │         → 完成后跳转到笔记详情页
  │
  ├── 笔记详情页
  │     ├── 原始内容 (可滚动)
  │     ├── AI 摘要
  │     ├── 知识点卡片列表 (名称+解释+所属领域)
  │     └── 分类标签
  │
  ├── 笔记列表页
  │     ├── 所有笔记卡片展示
  │     ├── 按分类筛选 + 关键词搜索
  │     └── 点击进入详情
  │
  ├── 复习中心 (选择题模式)
  │     ├── 题干卡片 + 4 个选项 (A/B/C/D)
  │     ├── 选择后即时反馈 (绿色✅ / 红色❌) + 解析
  │     ├── 点击「下一题」继续
  │     └── 全部完成 → 显示得分页
  │
  └── 弱项报告页
        ├── 本轮得分 (大号数字)
        ├── 雷达图展示各领域掌握度
        ├── 薄弱知识点清单 (表格)
        └── 「开始针对性复习」按钮
```

---

## 五、页面路由规划

| 路径 | 页面 | 说明 |
|------|------|------|
| `/login` | 登录 | 邮箱 + 密码 |
| `/register` | 注册 | 邮箱 + 昵称 + 密码 |
| `/dashboard` | 首页（工作台） | 登录后默认页 |
| `/notes` | 笔记列表 | 所有笔记 |
| `/note/:id` | 笔记详情 | AI 分析结果 |
| `/upload` | 上传笔记 | 文件/文字上传 |
| `/review` | 复习中心 | 选择题答题 |
| `/report` | 弱项报告 | 答题结果 |

---

## 六、数据库设计

### 6.1 核心表

**users 表**
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  nickname     String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  notes        Note[]
  reviewRecords ReviewRecord[]
  domainMastery DomainMastery[]
}
```

**notes 表**
```prisma
model Note {
  id          String   @id @default(cuid())
  userId      String
  title       String
  contentType String   // 'pdf' | 'docx' | 'text'
  originalText String? // PDF/Word 提取的纯文本
  rawContent  String?  // 直接输入的文字
  aiSummary   String?  // AI 生成的摘要
  tags        String?  // JSON 数组 ["经济学","微观经济学"]
  status      String   @default("analyzing") // analyzing | completed | failed
  filePath    String?  // 上传文件路径
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id])
  knowledgePoints KnowledgePoint[]
}
```

**knowledge_points 表**
```prisma
model KnowledgePoint {
  id          String   @id @default(cuid())
  noteId      String
  userId      String
  name        String
  description String?
  domain      String?  // 所属领域
  mastery     Float    @default(0) // 0.0 - 1.0
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  note        Note     @relation(fields: [noteId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  reviewRecords ReviewRecord[]
}
```

**review_records 表**
```prisma
model ReviewRecord {
  id               String          @id @default(cuid())
  userId           String
  knowledgePointId String
  questionType     String          // 'choice'
  questionText     String
  options          String?         // JSON: ["A.xxx","B.xxx","C.xxx","D.xxx"]
  correctAnswer    String
  userAnswer       String?
  isCorrect        Boolean?
  aiExplanation    String?         // 解析
  createdAt        DateTime        @default(now())
  user             User            @relation(fields: [userId], references: [id])
  knowledgePoint   KnowledgePoint  @relation(fields: [knowledgePointId], references: [id])
}
```

**domain_mastery 表**
```prisma
model DomainMastery {
  id        String   @id @default(cuid())
  userId    String
  domain    String   // 领域名称
  mastery   Float    @default(0) // 0.0 - 1.0
  pointCount Int     @default(0)
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])

  @@unique([userId, domain])
}
```

---

## 七、API 接口清单

| 方法 | 路径 | 说明 | 认证 |
|:----:|------|------|:----:|
| POST | `/api/auth/register` | 注册 | ❌ |
| POST | `/api/auth/login` | 登录，返回 JWT | ❌ |
| POST | `/api/notes/upload` | 上传文件笔记 | ✅ |
| POST | `/api/notes/text` | 提交文字笔记 | ✅ |
| GET | `/api/notes` | 获取笔记列表 | ✅ |
| GET | `/api/notes/:id` | 获取笔记详情 | ✅ |
| DELETE | `/api/notes/:id` | 删除笔记 | ✅ |
| GET | `/api/knowledge-points` | 获取知识点列表 | ✅ |
| GET | `/api/domain-mastery` | 获取各领域掌握度 | ✅ |
| POST | `/api/review/generate` | 生成选择题 | ✅ |
| POST | `/api/review/submit` | 提交答案 | ✅ |
| GET | `/api/review/report` | 获取弱项报告 | ✅ |

---

## 八、两阶段开发流程

### 第一阶段：Demo 冲刺（6/26 → 7/3）

这 8 天只做一件事：**让栩格核心闭环能跑通、能展示给评委看。**

```
---
📅 6/26（周五）Day 1 — 搭地基
│
├── 买服务器 → SSH 登录 → 装 Node.js + PostgreSQL + Nginx
├── 前端脚手架 (React + Vite + Tailwind + Router + Recharts)
├── 后端脚手架 (NestJS 或你选的框架 + Prisma)
├── 数据库表结构创建
└── 注册/登录接口 + 前端登录页
    ✅ 验收：能注册→登录→拿到 token
---
📅 6/27（周六）Day 2 — 核心功能
│
├── 笔记上传（拖拽/点击，支持 PDF/Word/文字）
├── pdf-parse / mammoth 文本提取
├── 调用 TRAE 模型分析笔记 → 提取知识点+摘要+标签
├── 笔记详情页（原始内容 + AI摘要 + 知识点卡片）
└── 笔记列表页（卡片视图 + 分类筛选）
    ✅ 验收：上传 PDF → AI 分析出知识点 → 能看
---
📅 6/28（周日）Day 3 — 核心闭环 🚀
│
├── 调用 TRAE 模型生成选择题（从知识点列表出 5 道）
├── 答题页 UI：题干 + 4 选项 + 点击反馈对错 + 解析弹窗
├── 下一题切换 + 全部完卷显示得分
└── 全链路联调：上传→分析→出题→答题→看分
    ✅ 验收：完整闭环跑通——这是最重要的里程碑
---
📅 6/29（周一）Day 4 — 视觉 + 部署
│
├── Dashboard 首页：雷达图 + 进度条 + 薄弱提醒 + 按钮
├── 弱项报告页：得分 + 薄弱知识点清单
└── 部署上线：Nginx 配置 → PM2 启动 → 域名可访问
    ✅ 验收：别人能通过链接使用栩格
---
📅 6/30（周二）Day 5 — UI 打磨
│
├── 配色体系统一（主色/辅色/危险色）
├── 卡片、按钮、输入框样式统一
├── 空状态/加载中/错误状态设计
├── 页面过渡动画
└── 字体 + 间距规范
    ✅ 验收：页面看起来像正式产品
---
📅 7/1（周三）Day 6 — Bug 修复 + 生产加固
│
├── 全页面边界情况测试
├── HTTPS 证书配置
├── CORS / 文件上传限制 / 统一错误处理
├── 使用说明页面
└── 反馈入口
    ✅ 验收：无明显 bug，可稳定运行
---
📅 7/2（周四）Day 7 — 演示准备
│
├── 演示脚本（7分钟版本）
├── 3 份演示笔记素材准备
├── 演示环境确认
├── Q&A 预演
└── 演示排练
---
📅 7/3（周五）Day 8 — 展示 + 收集反馈
│
├── 向评委/用户展示 Demo
├── 收集第一批使用反馈
└── 规划第二阶段要修什么
    ✅ Demo 完成
```

### 第二阶段：上线完善（7/3 → 7/10）

```
📅 7/3-7/4：根据 Demo 反馈修问题
📅 7/5-7/6：加开放问答复习模式
📅 7/7-7/8：加复习历史记录 + 错题本
📅 7/9：全面测试
📅 7/10：正式上线 + 推广
```

---

## 九、你（老伙计）需要做什么

### 按优先级排列

**🔴 现在就要决定的事：**

| 事项 | 说明 |
|------|------|
| **1. 后端框架选型** | NestJS / Spring Boot / Express？ 决定了我开始写什么代码 |
| **2. 买服务器** | 阿里云或腾讯云轻量服务器，2核2G以上，系统 Ubuntu 22.04，马上买 |

**🟡 开发过程中需要你提供的：**

| 事项 | 说明 | 什么时候要 |
|------|------|-----------|
| **3. 域名**（可选） | 如果要有自己的域名 xuge.xxx，现在买；国内服务器需要 ICP 备案（7-20天），来不及的话先用 IP 访问 | 越早越好 |
| **4. 演示用的笔记素材** | 准备 3 份不同学科的笔记（PDF 格式）用于演示和测试出题质量。最好内容结构化、主题清晰 | Day 2 前给到 |
| **5. 测试和验收** | 每个阶段完成后，你要登录实际用一遍，告诉我哪里不对 | 全程 |

**🟢 开发期间我能搞定的（你不用管）：**
- 所有代码编写
- 数据库设计和搭建
- AI Prompt 调优和对接
- 服务器部署和 Nginx 配置
- UI 设计和实现
- 演示准备

---

## 十、每天验收标准

### 第一阶段（6/26 → 7/3）

| 日期 | 睡前要能回答「今天跑通了什么」 |
|:----:|:-------------------------------|
| 6/26 | 能注册→登录，能上传 PDF 到服务器 |
| 6/27 | 上传后 AI 能分析出知识点，详情页能展示 |
| **6/28** | **🚀 能走完「上传→分析→出题→答题→看结果」完整闭环** |
| 6/29 | Dashboard 首页好看，网站已上线别人可访问 |
| 6/30 | 页面变漂亮了，配色统一 |
| 7/1 | 没发现明显 bug |
| 7/2 | 演示准备好 |
| 7/3 | 展示 Demo，收集反馈 |

### 第二阶段（7/3 → 7/10）

| 日期 | 目标 |
|:----:|:-----|
| 7/3-4 | 根据 Demo 反馈修问题 |
| 7/5-6 | 开放问答复习上线 |
| 7/7-8 | 复习历史 + 错题本上线 |
| 7/9 | 全面测试 |
| 7/10 | 正式上线推广 |
