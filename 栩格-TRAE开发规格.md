# 栩格 — TRAE 开发规格书

> **使用说明：** 本文档是 TRAE 开发用的完整规格，包含项目结构、代码生成指示、API 合约、数据库 Schema 和 UI 设计。建议在 TRAE Builder 中新建项目时以此为基准输入。

---

## 一、项目概要

**产品：** 栩格 — AI 知识体检与复习助手
**赛道：** TRAE AI 创造力大赛 · 学习工作
**技术栈：** React 18 + Vite + Tailwind CSS + Recharts（前端） / NestJS + Prisma + PostgreSQL（后端）
**部署：** 一台云服务器，Nginx + PM2
**AI：** TRAE 内置模型（通过 API 调用）

**核心闭环：** 上传笔记 → AI 分析提取知识点 → AI 生成选择题 → 用户作答 → 即时反馈 → 弱项报告

---

## 二、项目目录结构

```
xuge/
├── client/                          # 前端项目（React + Vite）
│   ├── public/
│   ├── src/
│   │   ├── components/              # 通用组件
│   │   │   ├── Layout/
│   │   │   │   ├── AppLayout.tsx       # 整体布局（导航+内容区）
│   │   │   │   └── Sidebar.tsx         # 侧边导航栏
│   │   │   ├── RadarChart.tsx          # 知识全景图雷达图（Recharts）
│   │   │   ├── ProgressBar.tsx         # 复习进度条
│   │   │   ├── NoteCard.tsx            # 笔记卡片
│   │   │   ├── KnowledgePointCard.tsx  # 知识点卡片
│   │   │   ├── QuestionCard.tsx        # 题目卡片（选择题）
│   │   │   ├── DropZone.tsx            # 文件拖拽上传
│   │   │   └── EmptyState.tsx          # 空状态占位
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx           # /login
│   │   │   ├── RegisterPage.tsx        # /register
│   │   │   ├── DashboardPage.tsx       # /dashboard（核心页面）
│   │   │   ├── NotesListPage.tsx       # /notes
│   │   │   ├── NoteDetailPage.tsx      # /note/:id
│   │   │   ├── UploadPage.tsx          # /upload
│   │   │   ├── ReviewPage.tsx          # /review
│   │   │   └── ReportPage.tsx          # /report
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # 认证状态
│   │   │   ├── useNotes.ts            # 笔记操作
│   │   │   └── useReview.ts           # 复习操作
│   │   ├── services/
│   │   │   ├── auth.ts                # 登录/注册 API
│   │   │   ├── notes.ts               # 笔记 API
│   │   │   └── review.ts              # 复习 API
│   │   ├── store/
│   │   │   └── authStore.ts           # Zustand 认证状态管理
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript 类型定义
│   │   ├── utils/
│   │   │   └── formatDate.ts          # 日期格式化工具
│   │   ├── App.tsx                    # 路由配置
│   │   ├── main.tsx                   # 入口
│   │   └── index.css                  # Tailwind 全局样式
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                          # 后端项目（NestJS）
│   ├── prisma/
│   │   └── schema.prisma               # 数据库模型定义
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts          # JWT 验证策略
│   │   │   └── jwt.guard.ts             # 认证守卫
│   │   ├── notes/
│   │   │   ├── notes.module.ts
│   │   │   ├── notes.controller.ts
│   │   │   ├── notes.service.ts
│   │   │   └── dto/
│   │   │       └── create-note.dto.ts
│   │   ├── knowledge-points/
│   │   │   ├── knowledge-points.module.ts
│   │   │   ├── knowledge-points.controller.ts
│   │   │   └── knowledge-points.service.ts
│   │   ├── review/
│   │   │   ├── review.module.ts
│   │   │   ├── review.controller.ts
│   │   │   ├── review.service.ts
│   │   │   └── dto/
│   │   │       ├── generate-question.dto.ts
│   │   │       └── submit-answer.dto.ts
│   │   ├── ai/
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.service.ts            # TRAE 模型调用封装
│   │   │   └── prompts/
│   │   │       ├── analyze-note.prompt.ts    # 笔记分析 Prompt
│   │   │       ├── generate-choice.prompt.ts # 选择题生成 Prompt
│   │   │       └── grade-answer.prompt.ts    # 答案评分 Prompt
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   └── main.ts
│   ├── uploads/                       # 上传文件存储目录
│   ├── .env                           # 环境变量
│   ├── package.json
│   ├── tsconfig.json
│   └── nest-cli.json
│
├── nginx.conf                         # Nginx 配置文件
├── ecosystem.config.js                # PM2 配置
└── README.md
```

---

## 三、TypeScript 类型定义（共用的数据结构）

放在 `client/src/types/index.ts`：

```typescript
// === 用户 ===
export interface User {
  id: string;
  email: string;
  nickname: string | null;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// === 笔记 ===
export interface Note {
  id: string;
  title: string;
  contentType: 'pdf' | 'docx' | 'text';
  aiSummary: string | null;
  tags: string[];          // 后端存 JSON 字符串，前端解析为数组
  status: 'analyzing' | 'completed' | 'failed';
  knowledgePoints: KnowledgePoint[];
  createdAt: string;
}

// === 知识点 ===
export interface KnowledgePoint {
  id: string;
  noteId: string;
  name: string;
  description: string | null;
  domain: string | null;
  mastery: number;         // 0-100
}

// === 选择题 ===
export interface ChoiceQuestion {
  id: string;
  knowledgePoint: string;
  question: string;
  options: string[];       // ["A. xxx", "B. xxx", "C. xxx", "D. xxx"]
  correctAnswer: string;   // "A" | "B" | "C" | "D"
  explanation: string;
}

// === 答题记录 ===
export interface ReviewRecord {
  id: string;
  questionText: string;
  userAnswer: string;
  isCorrect: boolean;
  aiExplanation: string;
}

// === 弱项报告 ===
export interface WeaknessReport {
  totalScore: number;       // 总分 0-100
  totalQuestions: number;
  correctCount: number;
  domainMastery: {          // 各领域掌握度
    domain: string;
    mastery: number;
  }[];
  weakPoints: {             // 薄弱知识点
    name: string;
    domain: string;
    mastery: number;
  }[];
}
```

---

## 四、数据库 Schema（Prisma）

放在 `server/prisma/schema.prisma`：

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String          @id @default(cuid())
  email          String          @unique
  passwordHash   String
  nickname       String?
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  notes          Note[]
  knowledgePoints KnowledgePoint[]
  reviewRecords  ReviewRecord[]
  domainMasteries DomainMastery[]
}

model Note {
  id             String           @id @default(cuid())
  userId         String
  title          String
  contentType    String           // "pdf" | "docx" | "text"
  originalText   String?
  rawContent     String?
  aiSummary      String?
  tags           String?          // JSON 数组
  status         String           @default("analyzing")  // "analyzing" | "completed" | "failed"
  filePath       String?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
  user           User             @relation(fields: [userId], references: [id])
  knowledgePoints KnowledgePoint[]
}

model KnowledgePoint {
  id             String          @id @default(cuid())
  noteId         String
  userId         String
  name           String
  description    String?
  domain         String?         // 所属领域，如 "经济学"
  mastery        Float           @default(0)  // 0.0 - 1.0
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  note           Note            @relation(fields: [noteId], references: [id])
  user           User            @relation(fields: [userId], references: [id])
  reviewRecords  ReviewRecord[]
}

model ReviewRecord {
  id               String          @id @default(cuid())
  userId           String
  knowledgePointId String
  questionType     String          // "choice"
  questionText     String
  options          String?         // JSON: ["A.xxx","B.xxx","C.xxx","D.xxx"]
  correctAnswer    String
  userAnswer       String?
  isCorrect        Boolean?
  aiExplanation    String?
  createdAt        DateTime        @default(now())
  user             User            @relation(fields: [userId], references: [id])
  knowledgePoint   KnowledgePoint  @relation(fields: [knowledgePointId], references: [id])
}

model DomainMastery {
  id         String   @id @default(cuid())
  userId     String
  domain     String
  mastery    Float    @default(0)
  pointCount Int      @default(0)
  updatedAt  DateTime @updatedAt
  user       User     @relation(fields: [userId], references: [id])

  @@unique([userId, domain])
}
```

---

## 五、API 接口完整合约

### 5.1 认证模块

```
POST /api/auth/register
  请求: { email: string, password: string, nickname?: string }
  响应: { token: string, user: { id, email, nickname, createdAt } }
  说明: 密码用 bcrypt 加密存储

POST /api/auth/login
  请求: { email: string, password: string }
  响应: { token: string, user: { id, email, nickname, createdAt } }
  说明: 验证密码后返回 JWT token，过期时间 7 天
```

### 5.2 笔记模块（全部需 JWT 认证）

```
POST /api/notes/upload
  请求: multipart/form-data { file: File, title?: string }
  响应: { id: string, title: string, status: "analyzing" }
  说明: 
    - multer 接收文件，存到 server/uploads/ 目录
    - pdf-parse 或 mammoth 提取文本
    - 异步调用 TRAE 模型分析文本
    - 分析完成后更新 note.status = "completed"

POST /api/notes/text
  请求: { title: string, content: string }
  响应: { id: string, title: string, status: "analyzing" }
  说明: 纯文本直接入库，异步 AI 分析

GET /api/notes
  查询参数: ?search=&domain=
  响应: Note[]

GET /api/notes/:id
  响应: Note & { knowledgePoints: KnowledgePoint[] }

DELETE /api/notes/:id
  响应: { success: true }
```

### 5.3 知识点模块（需 JWT 认证）

```
GET /api/knowledge-points
  查询参数: ?noteId=&domain=
  响应: KnowledgePoint[]
```

### 5.4 掌握度模块（需 JWT 认证）

```
GET /api/domain-mastery
  响应: { domains: { domain: string, mastery: number, pointCount: number }[] }
  说明: 查询 domain_mastery 表，返回当前用户所有领域掌握度
```

### 5.5 复习模块（需 JWT 认证）

```
POST /api/review/generate
  请求: { count?: number }  // 默认 5
  响应: {
    questions: [{
      id: string,
      knowledgePoint: string,
      question: string,
      options: string[],
      correctAnswer: string,
      explanation: string
    }]
  }
  说明:
    - 查询当前用户所有知识点列表
    - 调用 TRAE 模型生成选择题
    - 返回给前端

POST /api/review/submit
  请求: { questionId: string, userAnswer: string }
  响应: {
    isCorrect: boolean,
    explanation: string,
    correctAnswer: string,
    updatedMastery: number
  }
  说明:
    - 记录到 review_records 表
    - 更新 knowledge_point.mastery
    - 更新 domain_mastery 表

GET /api/review/report
  响应: WeaknessReport
  说明:
    - 统计当天/最近一轮答题记录
    - 按领域聚合掌握度
    - 返回薄弱知识点（mastery < 50%）
```

---

## 六、AI Prompt 设计（核心）

### 6.1 笔记分析 Prompt

```typescript
// server/src/ai/prompts/analyze-note.prompt.ts
export const ANALYZE_NOTE_PROMPT = `
你是一个知识分析专家。请分析以下笔记内容，完成以下任务：

1. 提取笔记中的核心知识点（每个知识点是一个独立的概念/理论/定义），提取 5-10 个
2. 为每个知识点生成一句话的简要解释
3. 判断每个知识点所属的学科领域（如：经济学、计算机科学、管理学等）
4. 生成一段 100-200 字的笔记摘要
5. 为笔记推荐 2-3 个分类标签

请严格以 JSON 格式返回，不要包含其他内容：
{
  "summary": "笔记摘要",
  "knowledge_points": [
    {"name": "知识点名称", "description": "简要解释", "domain": "所属领域"},
    ...
  ],
  "tags": ["标签1", "标签2"]
}

笔记内容：
{{NOTE_CONTENT}}
`;
```

### 6.2 选择题生成 Prompt

```typescript
// server/src/ai/prompts/generate-choice.prompt.ts
export const GENERATE_CHOICE_PROMPT = `
你是一位出题老师。基于以下知识点列表，生成 {{COUNT}} 道单选题。

要求：
- 每道题覆盖不同的知识点（不要重复）
- 每个题目有 4 个选项（A/B/C/D），只有一个正确答案
- 题目贴近实际应用场景，不要纯理论复述
- 包含答案解析（说明为什么正确以及为什么其他选项错误）

请严格以 JSON 格式返回，不要包含其他内容：
{
  "questions": [
    {
      "knowledge_point": "知识点名称",
      "question": "题干",
      "options": ["A. 选项A", "B. 选项B", "C. 选项C", "D. 选项D"],
      "correct_answer": "A",
      "explanation": "解析内容"
    }
  ]
}

知识点列表：
{{KNOWLEDGE_POINTS}}
`;
```

### 6.3 AI 服务调用封装

```typescript
// server/src/ai/ai.service.ts 核心逻辑

@Injectable()
export class AiService {
  // 调用 TRAE 内置模型的封装方法
  async callModel(prompt: string): Promise<string> {
    // 根据 TRAE API 文档实现
    // 调用 TRAE 内置模型（豆包/DeepSeek）
    // 返回模型输出的文本
  }

  // 安全解析 JSON 响应
  async parseJsonResponse<T>(prompt: string): Promise<T> {
    const raw = await this.callModel(prompt);
    // 从响应中提取 JSON 部分（模型可能输出额外文字）
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('模型返回格式错误');
    return JSON.parse(jsonMatch[0]);
  }

  async analyzeNote(content: string) {
    const prompt = ANALYZE_NOTE_PROMPT.replace('{{NOTE_CONTENT}}', content);
    return this.parseJsonResponse(prompt);
  }

  async generateQuestions(knowledgePoints: string[], count: number = 5) {
    const kpText = knowledgePoints.join('\n');
    const prompt = GENERATE_CHOICE_PROMPT
      .replace('{{KNOWLEDGE_POINTS}}', kpText)
      .replace('{{COUNT}}', count.toString());
    return this.parseJsonResponse(prompt);
  }
}
```

---

## 七、页面 UI 详细规格

### 7.1 登录/注册页

```
布局：居中卡片，简洁
元素：
  - 应用 Logo + 名称 "栩格"
  - Slogan: "把你的知识管起来，让遗忘有据可查"
  - 邮箱输入框
  - 密码输入框（注册页多一个昵称输入框）
  - 提交按钮
  - 切换链接 "已有账号？登录" / "没有账号？注册"
```

### 7.2 Dashboard 首页（核心视觉页）

```
布局：上下结构
顶部：
  - 用户头像 + 昵称
  - 日期显示

中部：大卡片 — 知识全景图雷达图
  - Recharts RadarChart 组件
  - 5-8 个维度（按用户实际笔记领域自动生成）
  - 数值范围 0-100
  - 颜色分段：绿色(>=70) / 黄色(40-69) / 红色(<40)
  - 悬停显示具体掌握度
  - 点击某维度跳转到该领域的复习
  - 无数据时显示空状态提示

左下部：今日复习进度卡片
  - "今日已完成 X/Y 题"
  - 进度条（渐变色填充）
  - 圆形百分比指示器

右下部：薄弱领域提醒卡片
  - 红色/橙色边框
  - 显示掌握度最低的 1-2 个领域
  - "你的'XX'领域掌握度仅 X%，建议今天复习"
  - 可点击跳转

底部：两个大按钮
  - 📤 上传笔记（主色填充）
  - 📝 开始复习（描边样式）
```

### 7.3 笔记上传页

```
布局：左右分栏（桌面）或上下（移动端）

左侧/上部：拖拽上传区域
  - 虚线边框区域
  - 拖拽时高亮
  - 显示"拖拽 PDF/Word 到此处"文字
  - 点击可打开文件选择器
  - 支持文件类型：.pdf, .docx
  - 选中文件后显示文件名+大小
  - 上传按钮

右侧/下部：文字输入区
  - 标题输入框
  - 富文本内容输入框（textarea 即可，MVP 不要求富文本编辑器）
  - 「提交文字笔记」按钮

上传后：显示 AI 分析中进度
  - 旋转加载动画
  - "AI 正在分析你的笔记…" 文字
  - 自动轮询状态，完成后跳转到笔记详情页
  - 失败时显示错误提示 + 重试按钮
```

### 7.4 笔记列表页

```
布局：网格卡片视图
  - 每张卡片：标题 | 标签（chip）| 知识点数量 | 上传时间
  - 按上传时间倒序排列
  - 点击卡片进入详情页

顶部：筛选+搜索栏
  - 标签下拉筛选
  - 关键词搜索输入框

空状态：引导插图 + "还没有笔记，先去上传一篇"
```

### 7.5 笔记详情页

```
布局：上下滚动

顶部：笔记标题 + 状态标签

内容区 1：AI 摘要（灰底卡片）
  - 自动生成的 1-2 段摘要

内容区 2：知识点列表
  - 知识点卡片网格
  - 每张卡片：知识点名称（加粗）+ 解释（小字）+ 所属领域标签
  - 展开可查看更多

内容区 3：分类标签
  - Chip 样式展示

底部操作：
  - 「开始复习这篇笔记」按钮
  - 「删除」按钮（确认弹窗）
```

### 7.6 复习中心——选择题模式

```
布局：全屏卡片，居中

步骤 1：开始页
  - "今天要复习的内容已就绪"
  - 显示即将覆盖的知识点数量
  - 「开始答题」按钮

步骤 2：答题页（每题一个页面）
  - 题号指示器 "第 3/5 题"
  - 题干文字（大号）
  - 4 个选项按钮（A/B/C/D）
  - 点击选项后立即显示结果：
    - 正确：变绿 + ✅ + 弹出解析
    - 错误：变红 + 正确答案变绿 + ❌ + 弹出解析
  - 解析区域：显示 correct_answer + explanation
  - 「下一题」按钮（点击后进入下一题）
  - 最后一题显示「查看结果」

步骤 3：结果页
  - 大号分数 "7/10" 或 "70%"
  - 评分等级标签
  - 「查看弱项报告」按钮
  - 「再来一轮」按钮

交互细节：
  - 选择后按钮变灰，不可再次点击（防止连点）
  - 解析默认展开
  - 题目切换用简单 fade 过渡
```

### 7.7 弱项报告页

```
布局：上下滚动

顶部：本轮总评
  - 大号数字显示得分
  - "共 X 题，答对 Y 题"
  - 薄弱程度标签（优秀/良好/一般/需努力）

中部：各领域掌握度
  - 简单柱状图或雷达图（可复用 RadarChart 组件）
  - 按掌握度从低到高排序

下部：薄弱知识点清单
  - 表格形式：知识点名称 | 所属领域 | 掌握度 | 建议操作
  - 掌握度用进度条展示
  - 红色标注掌握度低于 50% 的知识点

底部：「开始针对性复习」按钮
  - 点击后跳转到复习页，只出薄弱知识点的题
```

---

## 八、Nginx 配置

```nginx
# /etc/nginx/sites-available/xuge
server {
    listen 80;
    server_name 你的域名或服务器IP;
    client_max_body_size 20M;  # 允许上传大文件

    root /home/xuge/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /home/xige/server/uploads/;
    }
}
```

---

## 九、部署步骤

```bash
# 1. 服务器环境
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2

# 2. 创建数据库
sudo -u postgres psql -c "CREATE DATABASE xuge;"
sudo -u postgres psql -c "CREATE USER xuge_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE xuge TO xuge_user;"

# 3. 部署后端
git clone https://github.com/你的仓库/xuge.git
cd xuge/server
cp .env.example .env   # 填入 DATABASE_URL
npm install
npx prisma migrate deploy
npm run build
pm2 start dist/main.js --name xuge-server
pm2 save
pm2 startup

# 4. 部署前端
cd ../client
npm install
npm run build    # 生成 dist/ 目录

# 5. 配置 Nginx
sudo cp ../nginx.conf /etc/nginx/sites-available/xuge
sudo ln -s /etc/nginx/sites-available/xuge /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. HTTPS（可选但推荐）
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

---

## 十、环境变量

```bash
# server/.env
DATABASE_URL="postgresql://xuge_user:your_password@localhost:5432/xuge"
JWT_SECRET="生成一个随机字符串"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
PORT=3001
UPLOAD_DIR="./uploads"
CORS_ORIGIN="http://你的前端域名或IP"
```

```bash
# client/.env 开发时用，构建时直接打包进代码
VITE_API_URL="http://你的服务器IP:3001/api"
```

---

## 十一、开发顺序（TRAE Builder 分步提示）

以下是给 TRAE 的分步开发指示，按顺序输入即可逐步生成代码：

### Step 1: 初始化项目
```
用 Vite 创建一个 React + TypeScript 项目，安装 Tailwind CSS、react-router-dom、axios、recharts、zustand。
用 NestJS CLI 创建后端项目，安装 @nestjs/prisma、prisma、@prisma/client、bcryptjs、@nestjs/jwt、@nestjs/passport、passport-jwt、multer、pdf-parse、mammoth。
初始化 prisma schema（用上文第三节的 schema）。
```

### Step 2: 后端认证模块
```
在 NestJS 中创建 auth module：包含 register（bcrypt 加密密码）、login（返回 JWT token）、JwtAuthGuard。数据库使用 User 表。
```

### Step 3: 前端登录注册
```
创建 LoginPage.tsx 和 RegisterPage.tsx，使用 Tailwind 居中卡片布局。调用后端 /api/auth/login 和 /api/auth/register。登录成功后保存 token 到 localStorage，跳转到 /dashboard。
```

### Step 4: 后端笔记模块
```
创建 notes module：包含笔记上传（multer 处理文件，pdf-parse/mammoth 提取文本）、获取笔记列表、笔记详情、删除笔记。上传后异步调用 TRAE 模型分析（调用 ai.service.ts）。
```

### Step 5: AI 服务
```
创建 ai service，封装调用 TRAE 内置模型的 API。实现 analyzeNote（分析笔记提取知识点）、generateQuestions（生成选择题）。Prompt 用上文第六节的 Prompt。
```

### Step 6: 前端笔记模块
```
创建 UploadPage（拖拽上传+文字输入）、NotesListPage（卡片网格+搜索筛选）、NoteDetailPage（AI摘要+知识点卡片）。调用后端 API。
```

### Step 7: 后端复习模块
```
创建 review module：生成选择题（调用 ai.service）、提交答案（记录+更新掌握度）、获取弱项报告（聚合统计）。
```

### Step 8: 前端复习页
```
创建 ReviewPage：选择题答题交互（题干+4选项+即时反馈+解析+下一题+得分页）。调用后端 /api/review/generate 和 /api/review/submit。
```

### Step 9: Dashboard 首页
```
创建 DashboardPage：雷达图（Recharts RadarChart）+ 复习进度条 + 薄弱提醒卡片 + 操作按钮。从 /api/domain-mastery 获取数据。
```

### Step 10: 弱项报告页
```
创建 ReportPage：得分展示 + 雷达图 + 薄弱知识点清单表格。从 /api/review/report 获取数据。
```

### Step 11: UI 打磨
```
统一配色方案：主色 #4F46E5（靛蓝）、成功 #10B981（翠绿）、危险 #EF4444（红色）、背景 #F8FAFC（浅灰）。统一卡片圆角、间距、阴影。添加空状态、加载、错误样式。添加页面过渡动画。
```

---

## 十二、演示数据准备

用于测试 AI 出题效果的 3 份示范笔记（你自己找或写）：

**笔记 1：微观经济学**
```
内容建议包含：供需关系、边际效应递减、机会成本、完全竞争市场、垄断等核心概念
```

**笔记 2：计算机网络**
```
内容建议包含：OSI 七层模型、TCP/IP 协议、HTTP/HTTPS、IP 地址与子网掩码、DNS 解析等
```

**笔记 3：管理学原理**
```
内容建议包含：科学管理理论、马斯洛需求层次、SWOT 分析、PDCA 循环、激励理论等
```

> 每份笔记 500-2000 字，内容结构化，有定义有举例，AI 提取知识点效果会更好。

---

## 十三、演示脚本（7分钟）

```
0:00-0:30  开场："我是XXX，这是我的项目栩格——一个 AI 知识体检与复习助手"
0:30-1:00  痛点："学了就忘、不知道哪里弱、复习全靠意志力"
1:00-2:00  演示上传：「上传笔记」→ 拖拽 PDF → AI 分析中… → 完成
2:00-2:30  Dashboard：雷达图全景 + 今日进度 + 薄弱提醒
2:30-4:30  开始复习：AI 出 5 道题 → 逐题作答 → 即时反馈对错+解析
4:30-5:30  弱项报告：得分 + 薄弱知识点清单
5:30-6:30  TRAE 运用亮点：TRAE Work 流水线 + TRAE Builder 自适应复习计划
6:30-7:00  收尾：展望 +谢谢
```
