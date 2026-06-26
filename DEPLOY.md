# 栩格 — 部署指南

> **部署架构：** 前端 → GitHub Pages（免费）| 后端 → Railway（免费额度）| 数据库 → Railway PostgreSQL（内网直连）

---

## 一、准备工作

| 账号 | 用途 |
|------|------|
| [GitHub](https://github.com) | 托管代码 + GitHub Pages 部署前端 |
| [Railway](https://railway.app) | 部署后端 Node.js 服务 + PostgreSQL |

---

## 二、Railway 后端部署

### 2.1 创建 Railway 项目

1. 登录 [railway.app](https://railway.app)，点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 授权并选择你的 `xuge` 仓库
4. Railway 会自动识别 Node.js 项目

### 2.2 添加 PostgreSQL 数据库

1. 在项目面板点击 **New**
2. 选择 **Database → Add PostgreSQL**
3. 数据库会自动创建，并生成内部连接地址

> **关键：** Railway 的 PostgreSQL 默认只允许内部网络访问。因为后端也部署在 Railway 上，它们走内网连接，**不需要公网地址，也不需要 IP 白名单**。

### 2.3 配置环境变量

在 Railway 项目 → 后端服务 → **Variables** 中添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | 点击右侧按钮引用数据库内部地址 |
| `JWT_SECRET` | 随机长字符串 | 用于 JWT 签名，建议 32 位以上随机字符 |
| `NODE_ENV` | `production` | 生产环境标识 |
| `FRONTEND_URL` | `https://你的用户名.github.io` | 你的 GitHub Pages 地址，用于 CORS |

### 2.4 部署

Railway 会自动：
1. `npm install`
2. `npm run build`（自动执行 `prisma generate && tsc`）
3. `npm start`（运行 `node dist/index.js`）

部署完成后，Railway 会分配一个域名，例如：
```
https://xuge-production.up.railway.app
```

复制这个域名，后面前端要用。

---

## 三、GitHub Pages 前端部署

### 3.1 配置 GitHub Secrets

1. 打开 GitHub 仓库 → **Settings → Secrets and variables → Actions**
2. 点击 **New repository secret**
3. 添加：`VITE_API_URL`
4. 值为 Railway 后端地址 + `/api`，例如：
   ```
   https://xuge-production.up.railway.app/api
   ```

### 3.2 启用 GitHub Pages

1. 仓库 → **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 保存

### 3.3 触发部署

1. 把代码 push 到 `main` 分支：
   ```bash
   git add .
   git commit -m "准备部署"
   git push origin main
   ```
2. GitHub Actions 会自动构建前端并部署到 Pages
3. 部署完成后访问：
   ```
   https://你的用户名.github.io/xuge
   ```

---

## 四、验证部署

| 检查项 | 操作 |
|--------|------|
| 后端健康 | 访问 `https://你的后端域名/health`，应返回 `{"status":"ok"}` |
| 前端页面 | 访问 GitHub Pages 地址，应正常显示登录页 |
| 注册登录 | 在前端注册账号，数据应写入 Railway PostgreSQL |
| 上传笔记 | 上传 PDF/文字笔记，AI 分析应正常工作 |

---

## 五、后续更新代码

每次修改代码后，只需要：

```bash
git add .
git commit -m "更新内容"
git push origin main
```

- 前端会自动重新部署（GitHub Actions）
- 后端也会自动重新部署（Railway 检测到代码推送）

---

## 六、常见问题

**Q: Railway 免费额度够用吗？**
A: Railway 免费额度每月 $5，包含 500 小时运行时间和 1GB 内存。对于演示项目完全够用。

**Q: GitHub Pages 有流量限制吗？**
A: 每月 100GB 带宽，对于普通演示项目完全够用。

**Q: 我想绑定自己的域名怎么办？**
A: Railway 和 GitHub Pages 都支持自定义域名，在各自面板的 Settings → Domains 里配置即可。

**Q: 数据库数据会丢吗？**
A: Railway PostgreSQL 是持久化的，只要你不手动删除数据库，数据一直都在。
