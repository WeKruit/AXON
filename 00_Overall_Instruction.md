# WeCrew-AXON 多 Agent 开发 - 总指挥手册

**日期**: 2026-01-23
**版本**: 3.0

---

## 📋 概述

本手册帮助你协调 4 个 Claude Code agents 并行开发 WeCrew-AXON 项目。

---

## 🎯 MVP Task 执行顺序

### Phase 0: 基础设施 (Blake 独立完成)
```
WEC-51 → WEC-52 → WEC-53 → WEC-54
  ↓         ↓         ↓         ↓
Fork    Firestore  Supabase  Account API
```

| 顺序 | Ticket | 任务 | Agent | 自动化程度 |
|------|--------|------|-------|-----------|
| 1 | WEC-51 | Postiz Fork & 环境配置 | Blake | ✅ 全自动 |
| 2 | WEC-52 | Firestore 集成 | Blake | ✅ 全自动 |
| 3 | WEC-53 | Supabase Schema 扩展 | Blake | ✅ 全自动 |
| 4 | WEC-54 | Account Management API | Blake | ✅ 全自动 |

### Phase 1: 核心 API (Blake + Alex 并行)
```
         ┌─── WEC-55 (Alex) ───► WEC-62 ───► WEC-64
WEC-54 ──┤
         └─── WEC-56 (Blake) ──► WEC-57 ───► WEC-58
```

| 顺序 | Ticket | 任务 | Agent | 自动化程度 | 需要 |
|------|--------|------|-------|-----------|------|
| 5 | WEC-55 | Persona Management API | Alex | ✅ 全自动 | - |
| 6 | WEC-56 | IP/Proxy Management API | Blake | ⚠️ 半自动 | Proxy 凭证 |
| 7 | WEC-57 | AdsPower Integration | Alex | 🔴 需人工 | AdsPower 桌面端 |
| 8 | WEC-58 | Temporal Warming Workflow | Blake | ✅ 全自动 | - |
| 9 | WEC-59 | Temporal Warming Activities | Blake | ✅ 全自动 | - |
| 10 | WEC-60 | Task Trigger API | Blake | ✅ 全自动 | - |
| 11 | WEC-61 | Firestore Event Scheduling | Blake | ✅ 全自动 | - |

### Phase 2: AI/Browser 层 (Alex 主导)
```
WEC-57 ───► WEC-62 ───► WEC-63 ───► WEC-64 ───► WEC-65
AdsPower    LLM Mgr    Selenium    LLM Agent   LinkedIn
```

| 顺序 | Ticket | 任务 | Agent | 自动化程度 | 需要 |
|------|--------|------|-------|-----------|------|
| 12 | WEC-62 | LLM Provider Manager | Alex | ✅ 全自动 | OpenAI API Key |
| 13 | WEC-63 | Browser Controller (Selenium) | Alex | 🔴 需人工 | AdsPower Profile |
| 14 | WEC-64 | LLM Agent Core | Alex | ✅ 全自动 | - |
| 15 | WEC-65 | LinkedIn Platform Adapter | Alex | 🔴 需人工 | LinkedIn 账号 |
| 16 | WEC-66 | Content Generation API | Alex | ✅ 全自动 | - |

### Phase 3: 前端 (Casey 主导)
```
WEC-54 ───► WEC-67 ───► WEC-68 ───► WEC-69 ───► WEC-70 ───► WEC-71 ───► WEC-72
Account     Account     Persona     Proxy       Task        Warming     Content
API         Frontend    Frontend    Frontend    Frontend    Frontend    Frontend
```

| 顺序 | Ticket | 任务 | Agent | 自动化程度 |
|------|--------|------|-------|-----------|
| 17 | WEC-67 | Account Management Frontend | Casey | ✅ 全自动 |
| 18 | WEC-68 | Persona Management Frontend | Casey | ✅ 全自动 |
| 19 | WEC-69 | IP/Proxy Management Frontend | Casey | ✅ 全自动 |
| 20 | WEC-70 | Task Management Frontend | Casey | ✅ 全自动 |
| 21 | WEC-71 | Warming Monitoring Frontend | Casey | ✅ 全自动 |
| 22 | WEC-72 | Content Generation Frontend | Casey | ✅ 全自动 |

---

## 🔴 需要人工干预的任务

### WEC-57: AdsPower Integration
**干预类型**: 环境配置
**所需步骤**:
1. 下载并安装 AdsPower 桌面客户端: https://www.adspower.com/
2. 启动 AdsPower 并登录账号
3. 确保 Local API 已启用 (默认端口 50325)
4. 在 `.env` 中配置:
   ```
   ADSPOWER_API_URL=http://local.adspower.net:50325
   ```

**Agent 可以做的**: 写 API 调用代码、Mock 测试
**Agent 不能做的**: 安装软件、登录账号

---

### WEC-63: Browser Controller (Selenium)
**干预类型**: Profile 创建
**所需步骤**:
1. 在 AdsPower 中手动创建至少 1 个浏览器 Profile
2. 记录 Profile ID (在 AdsPower UI 中可见)
3. 配置 Proxy 到该 Profile (可选)
4. 提供 Profile ID 给 Agent 用于测试

**Agent 可以做的**: 写 Selenium 代码、通过 API 操作 Profile
**Agent 不能做的**: 在 GUI 中创建 Profile

---

### WEC-65: LinkedIn Platform Adapter
**干预类型**: 账号凭证
**所需步骤**:
1. 准备测试用 LinkedIn 账号 (建议用新账号，避免封号风险)
2. 在 AdsPower Profile 中登录该账号
3. 保持登录状态 (Cookie 会被 AdsPower 保存)
4. **可选**: 提供 LinkedIn 账号凭证用于自动登录

**Agent 可以做的**: 写自动化脚本、处理页面元素
**Agent 不能做的**: 登录 LinkedIn、处理验证码

---

### WEC-56: IP/Proxy Management API
**干预类型**: 凭证配置
**所需步骤**:
1. 从代理提供商获取代理凭证:
   - BrightData / Oxylabs / SmartProxy 等
   - 需要: Host, Port, Username, Password
2. 在 `.env` 中配置:
   ```
   PROXY_PROVIDER=brightdata
   PROXY_HOST=xxx.brightdata.com
   PROXY_PORT=22225
   PROXY_USER=your_user
   PROXY_PASS=your_pass
   ```

**Agent 可以做的**: 写 CRUD API、健康检查逻辑
**Agent 不能做的**: 购买/配置代理服务

---

## 🚀 启动顺序

```
Day 1:
├── 1. 立即启动 Blake agent (WEC-51) ─── 关键路径，无阻塞
├── 2. 立即启动 Tester agent ─────────── 并行写测试，无阻塞
│
Day 2+ (Blake 完成 WEC-52 后):
├── 3. 启动 Alex agent ─────────────── 等待 Firestore 集成完成
│      ⚠️ 在 WEC-57 前准备好 AdsPower
│
Day 3+ (Blake 完成 WEC-54 后):
└── 4. 启动 Casey agent ────────────── 等待 Account API 完成
```

---

## 📁 Prompt 文件列表

| 文件 | Agent | 用途 |
|------|-------|------|
| `01_Blake_Backend_Infrastructure.md` | Blake | 后端 + 基础设施 |
| `02_Alex_Backend_AI.md` | Alex | 后端 + AI |
| `03_Casey_Frontend.md` | Casey | 前端 |
| `04_Tester_QA.md` | Tester | QA 测试 |

---

## 🔧 通用配置

### Linear 配置
```
Team ID: c7cc1945-904c-40d9-86e6-87044917b7a1
Team Name: WeCrew-Axon
```

### Linear 状态 ID
| 状态 | ID | 用途 |
|------|-----|------|
| Backlog | `b259193b-1deb-4d08-8f83-f675c6e1821d` | 待排期 |
| Todo | `5a4583b7-9498-47a9-91f6-9b62e58c05d4` | 待开始 |
| In Progress | `b79e056d-c036-4069-90af-be28d875b931` | 开发中 |
| In Review | `0ad07573-e827-4f58-a5b4-3cea0c3cc37a` | PR 审核中 |
| Done | `7ab38e5f-b864-4373-91f4-c15c2ac09b37` | 已完成 |
| Canceled | `5a7032af-b11b-41b3-a007-0b94d538f675` | 已取消 |

### Vibe Kanban 配置
```
Project ID: ed04229c-288d-4a7d-9ef9-63107d5fc15e
```

### Git 分支命名
| Agent | 分支前缀 | 示例 |
|-------|---------|------|
| Blake | `feature/blake/` | `feature/blake/m0-1-postiz-fork` |
| Alex | `feature/alex/` | `feature/alex/m2-1-persona-api` |
| Casey | `feature/casey/` | `feature/casey/m7-1-account-frontend` |
| Tester | `feature/tester/` | `feature/tester/e2e-account-management` |

---

## 📊 文件所有权分配（防冲突）

### Blake 负责
```
apps/backend/src/services/
  ├── firestore.service.ts
  ├── account.service.ts
  ├── proxy.service.ts
  └── temporal.service.ts
apps/backend/src/controllers/
  ├── account.controller.ts
  └── proxy.controller.ts
apps/backend/src/workflows/
apps/backend/prisma/
docker-compose.yml
infra/
```

### Alex 负责
```
apps/backend/src/ai/
apps/backend/src/selenium/
apps/backend/src/services/
  ├── persona.service.ts
  ├── content.service.ts
  └── adspower.service.ts
apps/backend/src/controllers/
  ├── persona.controller.ts
  └── content.controller.ts
```

### Casey 负责
```
apps/frontend/src/pages/
apps/frontend/src/components/
apps/frontend/src/hooks/
```

### Tester 负责
```
tests/integration/
tests/e2e/
tests/fixtures/
```

---

## 📈 依赖关系图

```
WEC-51 (Blake) ─────┬───► WEC-52 (Blake) ────► WEC-53 (Blake)
[Postiz Fork]       │     [Firestore]          [Supabase Schema]
   ✅ 全自动        │        ✅ 全自动             ✅ 全自动
                    │
                    ├───► WEC-54 (Blake) ────► WEC-67 (Casey)
                    │     [Account API]        [Account UI]
                    │        ✅ 全自动             ✅ 全自动
                    │
                    └───► WEC-55 (Alex) ─────► WEC-57 (Alex)
                          [Persona API]        [AdsPower]
                             ✅ 全自动          🔴 需人工
                                                   │
                                                   ▼
                          WEC-62 ────► WEC-63 ────► WEC-65
                          [LLM Mgr]   [Selenium]   [LinkedIn]
                          ✅ 全自动   🔴 需人工    🔴 需人工
```

---

## 🔍 监控进度

### 检查 Linear 状态
使用 Linear MCP 查询：
```
list_issues with team: "c7cc1945-904c-40d9-86e6-87044917b7a1"
```

### 关键检查点

| 检查点 | 触发条件 | 动作 |
|--------|----------|------|
| WEC-51 Done | Blake 完成 Postiz Fork | 继续 WEC-52 |
| WEC-52 Done | Blake 完成 Firestore | **启动 Alex** |
| WEC-54 Done | Blake 完成 Account API | **启动 Casey** |
| WEC-55 Done | Alex 完成 Persona API | **准备 AdsPower** |
| WEC-57 开始前 | Alex 即将开始 AdsPower | **人工配置 AdsPower** |
| WEC-63 开始前 | Alex 即将开始 Selenium | **人工创建 Profile** |
| WEC-65 开始前 | Alex 即将开始 LinkedIn | **人工登录 LinkedIn** |
| 所有 PR 合并 | 每天检查 | 更新 Linear 状态 |

---

## 🚨 处理阻塞

当 agent 报告阻塞时：

1. **检查依赖 ticket 状态**
2. **如果依赖未完成**: 让 agent 做准备工作
3. **如果是技术问题**: 在 Linear 创建 blocker issue
4. **如果需要凭证**: 提供所需凭证
5. **如果是 AdsPower 相关**: 见上方"需要人工干预的任务"

---

## ✅ 每日检查清单

- [ ] 检查所有 "In Progress" tickets
- [ ] 检查是否有新的 PR 需要 review
- [ ] 检查是否有 blocker 需要处理
- [ ] 检查依赖 tickets 完成情况，启动等待中的 agents
- [ ] 检查测试覆盖率报告
- [ ] **在 Alex 到达 WEC-57 前**: 确保 AdsPower 已安装并运行

---

## 📞 团队联系

| 角色 | 邮箱 |
|------|------|
| Blake | indolencorlol@gmail.com |
| Alex | admin1@wekruit.com |
| Casey | wekruit2024@gmail.com |

---

## 🏃 快速开始命令

### 启动 Blake (Day 1)
```bash
# 打开新终端，进入项目目录
cd /Users/adam/Desktop/WeKruit/WeCrew/AXON
# 复制 01_Blake_Backend_Infrastructure.md 内容到 Claude Code
```

### 启动 Alex (Day 2+, WEC-52 完成后)
```bash
# 先确保 AdsPower 已安装并运行
# 打开新终端
cd /Users/adam/Desktop/WeKruit/WeCrew/AXON
# 复制 02_Alex_Backend_AI.md 内容到 Claude Code
```

### 启动 Casey (Day 3+, WEC-54 完成后)
```bash
# 打开新终端
cd /Users/adam/Desktop/WeKruit/WeCrew/AXON
# 复制 03_Casey_Frontend.md 内容到 Claude Code
```

---

**准备好了！打开对应的 prompt 文件，复制到 Claude Code session 开始开发！**
