# Claude Code 开发指令 — 考研数学智能学习平台 MVP

## 你的角色

你是这个项目的主程序员（Orchestrator）。你的任务是：
1. 完整理解下面的项目规格
2. 将开发任务拆解为可并行的子任务
3. 用 subagent（Task 工具）并行执行各子任务
4. 统一整合，确保各模块接口一致

---

## 项目概述

**产品名称：** 考研数学智能学习平台
**产品形态：** 纯 Web 端，PC 优先，响应式
**核心价值：** 基于历年真题（1987-2023）的自适应刷题 + AI 分层答疑
**目标用户：** 备考考研数学（数一/数二/数三）的学生

---

## 技术栈（严格遵守，不得擅自更换）

| 层 | 技术 | 说明 |
|---|---|---|
| 框架 | **Next.js 14**（App Router） | 前后端一体，Route Handlers 做 API |
| 语言 | **TypeScript**（严格模式） | 所有文件均为 .ts / .tsx |
| 数据库 | **Supabase**（PostgreSQL） | 通过 `@supabase/supabase-js` 客户端访问 |
| 认证 | **Supabase Auth** | 邮箱 Magic Link（主）+ 微信 OAuth（辅） |
| 样式 | **Tailwind CSS** | 不引入 Shadcn 以外的 UI 库 |
| UI 组件 | **Shadcn/ui** | `npx shadcn-ui@latest add` 按需添加 |
| 数学公式 | **KaTeX** | `react-katex` 封装，SSR 兼容 |
| 数据可视化 | **Recharts** | 学习进度图表 |
| 状态管理 | **Zustand** | 客户端全局状态（题目进度、用户信息） |
| 数据请求 | **TanStack Query（React Query）** | 服务端数据缓存与同步 |
| AI 接口 | **DeepSeek API**（付费）/ **GLM-4-Flash API**（免费） | Route Handler 内调用，SSE 流式透传 |
| 部署 | **Vercel**（GitHub 自动部署） | — |

---

## 环境变量（在 `.env.local` 中配置，不得硬编码）

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DEEPSEEK_API_KEY=
GLM_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 数据库 Schema（在 Supabase 中执行）

```sql
-- 启用 UUID 扩展
create extension if not exists "uuid-ossp";

-- =====================
-- 科目表
-- =====================
create table subjects (
  id serial primary key,
  code text not null unique,       -- 'math1' | 'math2' | 'math3'
  name text not null               -- '数学一' | '数学二' | '数学三'
);

insert into subjects (code, name) values
  ('math1', '数学一'),
  ('math2', '数学二'),
  ('math3', '数学三');

-- =====================
-- 章节表
-- =====================
create table chapters (
  id serial primary key,
  subject_id integer references subjects(id),
  code text not null unique,       -- 'H01' 高数第1章, 'L01' 线代第1章, 'P01' 概率第1章
  name text not null,
  display_order integer not null
);

-- =====================
-- 知识点表
-- =====================
create table knowledge_points (
  id serial primary key,
  chapter_id integer references chapters(id),
  code text not null unique,       -- 'H01-01', 'H01-02' ...
  name text not null,
  description text,
  importance text check (importance in ('high', 'medium', 'low')) default 'medium'
);

-- =====================
-- 题目表（核心）
-- =====================
create table questions (
  id uuid primary key default uuid_generate_v4(),
  subject_id integer references subjects(id),
  chapter_id integer references chapters(id),
  knowledge_point_id integer references knowledge_points(id),

  type text not null check (type in ('choice', 'fill', 'essay')),
  -- choice=选择题, fill=填空题, essay=解答题

  content text not null,           -- 题目正文（含 LaTeX，使用 $...$ 包裹公式）
  options jsonb,                   -- 选择题选项: {"A":"...","B":"...","C":"...","D":"..."}
  answer text not null,            -- 选择题: "A" | 填空题: 答案文本 | 解答题: 标准答案
  solution text,                   -- 完整解析过程

  source text not null check (source in ('real_exam', 'liyongle_adv', 'original')),
  -- real_exam=历年真题, liyongle_adv=李永乐进阶题, original=自编题

  year integer,                    -- 真题年份，如 2015（非真题为 null）
  pool_type text check (pool_type in ('training', 'mock')),
  -- training=训练库(≤2022), mock=模拟库(2023+)

  difficulty integer check (difficulty between 1 and 5) default 3,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- 用户档案（扩展 Supabase auth.users）
-- =====================
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  avatar_url text,
  subject_id integer references subjects(id),  -- 用户选择的科目
  target_year integer,                          -- 目标考试年份，如 2027
  daily_goal_minutes integer default 60,
  subscription_tier text check (subscription_tier in ('free', 'monthly', 'quarterly', 'yearly', 'lifetime')) default 'free',
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 新用户注册时自动创建档案
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into user_profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- =====================
-- 用户学习进度（SM-2 状态，每用户每知识点一条）
-- =====================
create table user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  knowledge_point_id integer references knowledge_points(id),

  level integer check (level between 1 and 5) default 1,
  -- 1=初识, 2=理解, 3=熟练, 4=掌握, 5=精通

  ease_factor float default 2.5,   -- SM-2 参数
  interval_days integer default 1, -- 下次复习间隔天数
  next_review_at date default current_date,
  total_attempts integer default 0,
  correct_attempts integer default 0,

  unique(user_id, knowledge_point_id)
);

-- =====================
-- 用户答题记录
-- =====================
create table answer_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  question_id uuid references questions(id),
  user_answer text,
  is_correct boolean not null,
  time_spent_seconds integer,
  session_type text check (session_type in ('train', 'review', 'mock')),
  answered_at timestamptz default now()
);

-- =====================
-- 错题本
-- =====================
create table wrong_questions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  question_id uuid references questions(id),
  added_at timestamptz default now(),
  is_resolved boolean default false,
  notes text,
  unique(user_id, question_id)
);

-- =====================
-- AI 对话记录（用于配额控制 + 后续分析）
-- =====================
create table ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  question_id uuid references questions(id),
  model_used text,                 -- 'glm-4-flash' | 'deepseek-reasoner'
  user_message text not null,
  ai_response text,
  created_at timestamptz default now()
);

-- =====================
-- Row Level Security（RLS）
-- =====================
alter table user_profiles enable row level security;
alter table user_progress enable row level security;
alter table answer_logs enable row level security;
alter table wrong_questions enable row level security;
alter table ai_conversations enable row level security;

-- 用户只能读写自己的数据
create policy "users can manage own profile" on user_profiles for all using (auth.uid() = id);
create policy "users can manage own progress" on user_progress for all using (auth.uid() = user_id);
create policy "users can manage own logs" on answer_logs for all using (auth.uid() = user_id);
create policy "users can manage own wrong questions" on wrong_questions for all using (auth.uid() = user_id);
create policy "users can manage own ai conversations" on ai_conversations for all using (auth.uid() = user_id);

-- 题目表所有人可读，只有 service_role 可写
alter table questions enable row level security;
create policy "questions are publicly readable" on questions for select using (is_published = true);
```

---

## 项目目录结构（必须严格遵守）

```
kaoyan-math/
├── app/
│   ├── layout.tsx                    # 根布局（字体、全局样式、Providers）
│   ├── page.tsx                      # 落地页（未登录展示）
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx              # 登录页
│   ├── (app)/                        # 需要登录的页面组（layout 做鉴权）
│   │   ├── layout.tsx                # App 层布局（侧边栏导航 + 顶部栏）
│   │   ├── dashboard/
│   │   │   └── page.tsx              # 学习主面板
│   │   ├── train/
│   │   │   ├── page.tsx              # 章节选择页
│   │   │   └── [chapterCode]/
│   │   │       └── page.tsx          # 练题页（核心页面）
│   │   ├── review/
│   │   │   └── page.tsx              # 间隔复习页（今日待复习）
│   │   ├── wrong/
│   │   │   └── page.tsx              # 错题本页面
│   │   ├── mock/
│   │   │   └── page.tsx              # 模拟考试页
│   │   └── profile/
│   │       └── page.tsx              # 个人设置（科目、目标年份）
│   └── api/
│       ├── ai/
│       │   └── chat/
│       │       └── route.ts          # AI 答疑（SSE 流式）
│       ├── questions/
│       │   └── route.ts              # 获取题目列表
│       ├── answer/
│       │   └── route.ts              # 提交答案 + 更新 SM-2 进度
│       └── progress/
│           └── route.ts             # 获取用户学习进度统计
├── components/
│   ├── ui/                           # Shadcn 自动生成，不要手动修改
│   ├── layout/
│   │   ├── Sidebar.tsx               # 左侧导航栏
│   │   └── TopBar.tsx                # 顶部状态栏
│   ├── question/
│   │   ├── QuestionCard.tsx          # 题目展示卡片（含 KaTeX 渲染）
│   │   ├── ChoiceQuestion.tsx        # 选择题交互组件
│   │   ├── FillQuestion.tsx          # 填空题交互组件
│   │   ├── EssayQuestion.tsx         # 解答题 + 自评组件
│   │   └── SolutionPanel.tsx         # 解析展示面板（步骤式揭示）
│   ├── ai/
│   │   ├── AIChatPanel.tsx           # AI 答疑侧边面板
│   │   └── AIMessage.tsx             # 单条 AI 消息（流式渲染）
│   ├── dashboard/
│   │   ├── KnowledgeMap.tsx          # 知识点掌握度热力图
│   │   ├── StudyStats.tsx            # 学习统计（Recharts）
│   │   └── ReviewReminder.tsx        # 今日复习提醒卡片
│   └── common/
│       ├── MathText.tsx              # KaTeX 渲染封装组件（最常用）
│       ├── LoadingSpinner.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # 浏览器端 Supabase 客户端
│   │   ├── server.ts                 # 服务端 Supabase 客户端（Server Components）
│   │   └── middleware.ts             # Supabase Auth 中间件（刷新 Session）
│   ├── sm2.ts                        # SM-2 间隔重复算法
│   ├── ai.ts                         # AI 模型选择 + Prompt 构建工具函数
│   └── utils.ts                      # 通用工具函数
├── types/
│   └── index.ts                      # 所有 TypeScript 类型定义（数据库行类型 + 应用类型）
├── middleware.ts                     # Next.js 中间件（路由鉴权保护）
├── .env.local                        # 本地环境变量（不提交 git）
├── .env.example                      # 环境变量示例（提交 git）
└── supabase/
    └── schema.sql                    # 上面的数据库 DDL（存档用）
```

---

## 核心类型定义（types/index.ts 必须包含）

```typescript
// 数据库行类型
export type Subject = { id: number; code: 'math1' | 'math2' | 'math3'; name: string }
export type Chapter = { id: number; subject_id: number; code: string; name: string; display_order: number }
export type KnowledgePoint = { id: number; chapter_id: number; code: string; name: string; description: string | null; importance: 'high' | 'medium' | 'low' }

export type QuestionType = 'choice' | 'fill' | 'essay'
export type PoolType = 'training' | 'mock'
export type SubscriptionTier = 'free' | 'monthly' | 'quarterly' | 'yearly' | 'lifetime'

export type Question = {
  id: string
  subject_id: number
  chapter_id: number
  knowledge_point_id: number | null
  type: QuestionType
  content: string
  options: Record<'A' | 'B' | 'C' | 'D', string> | null
  answer: string
  solution: string | null
  source: 'real_exam' | 'liyongle_adv' | 'original'
  year: number | null
  pool_type: PoolType | null
  difficulty: number
}

export type UserProfile = {
  id: string
  nickname: string | null
  subject_id: number | null
  target_year: number | null
  daily_goal_minutes: number
  subscription_tier: SubscriptionTier
  subscription_expires_at: string | null
}

export type UserProgress = {
  id: string
  user_id: string
  knowledge_point_id: number
  level: 1 | 2 | 3 | 4 | 5
  ease_factor: number
  interval_days: number
  next_review_at: string
  total_attempts: number
  correct_attempts: number
}

// SM-2 算法输入/输出
export type SM2Input = {
  easeFactor: number
  intervalDays: number
  level: number
  quality: 0 | 1 | 2 | 3 | 4 | 5  // 0-1=错误, 2=困难, 3=良好, 4=较好, 5=完美
}

export type SM2Output = {
  newEaseFactor: number
  newIntervalDays: number
  newLevel: 1 | 2 | 3 | 4 | 5
  nextReviewAt: Date
}

// AI 相关
export type AIModel = 'glm-4-flash' | 'deepseek-reasoner'
export type AIMessage = { role: 'user' | 'assistant' | 'system'; content: string }
```

---

## SM-2 算法实现规范（lib/sm2.ts）

实现标准 SM-2 间隔重复算法：
- `quality` 根据答题结果映射：答对且快速=5，答对但慢=3，答错=1
- `easeFactor` 最小值为 1.3，不得低于此值
- `intervalDays`：第1次复习=1天，第2次=6天，之后 = round(上次interval × easeFactor)
- `level` 映射：interval ≤1=Lv1, ≤3=Lv2, ≤7=Lv3, ≤21=Lv4, >21=Lv5
- 答错时 interval 重置为 1，level 降1级（最低 Lv1）

---

## MVP 任务拆解（使用 subagent 并行执行）

请将以下任务分配给并行 subagent 执行。各任务之间通过共享的 `types/index.ts` 和数据库 Schema 保持接口一致。

---

### Task 1：项目脚手架初始化（必须最先完成，其他任务依赖此任务）

**执行内容：**
1. `npx create-next-app@latest kaoyan-math --typescript --tailwind --app --src-dir no --import-alias "@/*"`
2. 安装依赖：
   ```bash
   npm install @supabase/supabase-js @supabase/ssr
   npm install zustand @tanstack/react-query
   npm install react-katex katex
   npm install recharts
   npm install lucide-react
   npx shadcn-ui@latest init
   npx shadcn-ui@latest add button card input label badge progress separator skeleton toast
   ```
3. 创建 `types/index.ts`（完整内容见上方「核心类型定义」章节）
4. 创建 `lib/supabase/client.ts`、`lib/supabase/server.ts`、`lib/supabase/middleware.ts`（参考 Supabase Next.js 官方文档 SSR 实现）
5. 创建 `middleware.ts`（保护 `/app/**` 路由，未登录重定向至 `/login`）
6. 创建 `lib/sm2.ts`（实现规范见上方「SM-2 算法实现规范」）
7. 创建 `.env.example`
8. 创建 `supabase/schema.sql`（内容见上方「数据库 Schema」章节）
9. 配置 `app/layout.tsx`（全局 QueryClientProvider + Toaster，引入 KaTeX CSS）
10. 创建 `components/common/MathText.tsx`：
    ```tsx
    // 封装 KaTeX 渲染，支持行内公式 $...$ 和块级公式 $$...$$
    // 将文本按公式分段，非公式部分直接渲染文本，公式部分用 InlineMath/BlockMath 渲染
    ```

**完成标志：** `npm run dev` 成功启动，访问 `localhost:3000` 无报错

---

### Task 2：认证系统（依赖 Task 1）

**执行内容：**

1. **`app/(auth)/login/page.tsx`** — 登录页面：
   - 简洁的居中卡片布局
   - 输入框：邮箱地址
   - 按钮：「发送登录链接」
   - 点击后调用 `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '/dashboard' } })`
   - 发送成功后显示「✉️ 登录链接已发送，请查收邮件」提示
   - 底部微信登录按钮（预留 UI，OAuth 配置后激活）

2. **`app/(app)/layout.tsx`** — App 层布局：
   - 服务端获取 session，未登录跳转 `/login`
   - 包含 `Sidebar` + 主内容区两栏布局

3. **`components/layout/Sidebar.tsx`** — 侧边导航：
   - 用户头像 + 昵称
   - 导航项：仪表盘 / 专题训练 / 今日复习 / 错题本 / 模拟考试 / 个人设置
   - 底部：当前订阅状态徽章

4. **`app/(app)/profile/page.tsx`** — 个人设置：
   - 选择科目（数学一/数学二/数学三）
   - 设置目标考试年份（下拉菜单，2025-2030）
   - 保存后更新 `user_profiles` 表

---

### Task 3：题目展示核心组件（依赖 Task 1）

**执行内容：**

1. **`components/question/QuestionCard.tsx`** — 题目卡片：
   - 显示题目编号、来源标签（真题年份 / 李永乐）、难度星级
   - 使用 `MathText` 组件渲染题目正文
   - 根据 `type` 渲染不同的答题组件

2. **`components/question/ChoiceQuestion.tsx`** — 选择题：
   - A/B/C/D 四个选项，使用 `MathText` 渲染选项内容
   - 点击选项后高亮，提交后显示：答对=绿色✓，答错=红色✗并标注正确答案
   - 状态：`idle → selected → submitted`

3. **`components/question/FillQuestion.tsx`** — 填空题：
   - 文本输入框填写答案
   - 提交后与标准答案对比（精确匹配 + 模糊匹配），展示正确答案

4. **`components/question/EssayQuestion.tsx`** — 解答题：
   - 「查看解析」按钮（点击展开标准解析）
   - 用户自评：「完全正确 / 部分正确 / 完全错误」三个按钮
   - 自评结果映射到 SM-2 quality：5 / 3 / 1

5. **`components/question/SolutionPanel.tsx`** — 解析面板：
   - 逐步展示解题过程（将 solution 按 `\n\n` 分段为步骤）
   - 「下一步」按钮逐步揭示，最后显示「查看完整解析」
   - 使用 `MathText` 渲染所有数学公式

6. **`components/common/MathText.tsx`** — 增强版（如 Task 1 未完善）：
   - 正则分析文本中的 `$...$`（行内）和 `$$...$$`（块级）公式
   - 按段落分割，公式部分用 KaTeX 渲染，纯文本部分直接渲染

---

### Task 4：核心练题页面（依赖 Task 2、Task 3）

**执行内容：**

1. **`app/api/questions/route.ts`** — 题目 API：
   ```typescript
   // GET /api/questions?chapter=H01&type=choice&limit=10&exclude=id1,id2
   // 返回指定章节的题目列表
   // 免费用户：每章每日最多返回 5 题（用 answer_logs 判断今日已做数量）
   // 付费用户：无限制
   ```

2. **`app/api/answer/route.ts`** — 提交答案 API：
   ```typescript
   // POST /api/answer { questionId, userAnswer, isCorrect, timeSpentSeconds, sessionType }
   // 1. 写入 answer_logs
   // 2. 若答错，upsert wrong_questions
   // 3. 计算 SM-2 quality，更新 user_progress
   // 4. 返回更新后的知识点 level 和 nextReviewAt
   ```

3. **`app/(app)/train/page.tsx`** — 章节选择页：
   - 三栏卡片：高等数学 / 线性代数 / 概率论
   - 展开各科目的章节列表
   - 每个章节卡片显示：章节名称、知识点掌握进度条（基于 user_progress level 均值）
   - 点击进入该章节练题

4. **`app/(app)/train/[chapterCode]/page.tsx`** — 核心练题页：
   - **左侧 60%**：题目展示区（QuestionCard）
     - 顶部进度条：本节已做 / 总题数
     - 题目卡片（含公式渲染）
     - 答题交互（选择/填空/解答）
     - 解析面板（答题后展开）
     - 底部：「下一题」按钮
   - **右侧 40%**：AI 助教面板（AIChatPanel，初始折叠）
     - 「问 AI 助教」按钮展开
     - 免费用户：显示今日剩余次数（3次）
     - 付费用户：直接展开对话框
   - 题目通过 `useSWR` 预取下一题（提升流畅感）

---

### Task 5：AI 答疑系统（依赖 Task 1）

**执行内容：**

1. **`lib/ai.ts`** — AI 工具函数：
   ```typescript
   // getModelForUser(subscriptionTier): AIModel
   // 免费用户 → 'glm-4-flash'，付费用户 → 'deepseek-reasoner'

   // buildSystemPrompt(question, userProfile, recentErrors): string
   // 构建 System Prompt，注入题目上下文和用户学习档案

   // checkDailyQuota(userId): Promise<{ allowed: boolean, remaining: number }>
   // 查询 ai_conversations 表，统计今日使用次数
   ```

2. **`app/api/ai/chat/route.ts`** — AI 答疑接口（SSE 流式）：
   ```typescript
   // POST /api/ai/chat { questionId, message, conversationHistory }
   // 1. 验证用户身份（Supabase Auth）
   // 2. 检查 subscription_tier，选择模型
   // 3. 免费用户检查今日配额（3次/天），超限返回 429 + 升级提示
   // 4. 免费用户且题目为 essay 类型，拒绝并提示升级
   // 5. 构建 System Prompt（含题目内容 + 苏格拉底引导原则）
   // 6. 调用对应 AI API（stream: true）
   // 7. 透传 SSE 流给前端
   // 8. 流结束后异步写入 ai_conversations 记录
   ```

   System Prompt 模板：
   ```
   你是一位专业的考研数学助教，正在辅导一位备考{target_year}年{subject_name}的学生。

   【当前题目】
   {question_content}

   【交互原则】
   1. 采用苏格拉底式引导，不直接给出完整解答
   2. 每次只引导一个思考步骤，等待学生回应
   3. 若学生明确要求"直接告诉我答案"，则给出完整解析
   4. 数学公式使用 LaTeX 格式（$...$）
   5. 只讨论考研数学相关内容，拒绝其他话题
   ```

3. **`components/ai/AIChatPanel.tsx`** — AI 对话面板：
   - 折叠/展开动画
   - 消息列表（用户消息右对齐，AI 消息左对齐）
   - AI 消息使用 `MathText` 渲染（支持公式）
   - 输入框 + 发送按钮
   - 免费用户显示「剩余 X 次」角标
   - 流式接收：使用 `ReadableStream` 逐字渲染 AI 回复

4. **`components/ai/AIMessage.tsx`** — 消息组件：
   - 支持流式渲染（`isStreaming` prop 时显示光标动画）
   - 使用 `MathText` 渲染内容中的数学公式

---

### Task 6：仪表盘与学习统计（依赖 Task 2）

**执行内容：**

1. **`app/api/progress/route.ts`** — 进度统计 API：
   ```typescript
   // GET /api/progress
   // 返回：
   // - 各章节知识点掌握度（user_progress level 分布）
   // - 今日答题数、正确率
   // - 连续打卡天数（从 answer_logs 计算）
   // - 今日待复习知识点数（next_review_at <= today）
   ```

2. **`app/(app)/dashboard/page.tsx`** — 学习主面板：
   - 顶部：欢迎语 + 今日目标进度环形图
   - 「今日复习」提醒卡片（待复习知识点数量）
   - 「继续练习」快捷入口（上次练习的章节）
   - 知识点掌握度热力图（`KnowledgeMap` 组件）
   - 最近 7 天答题趋势折线图（Recharts）

3. **`components/dashboard/KnowledgeMap.tsx`** — 知识图谱热力图：
   - 按科目分组，展示各章节的整体掌握度
   - 颜色编码：灰=未开始，红=Lv1-2，黄=Lv3，绿=Lv4-5
   - 点击章节跳转到该章节练题

4. **`app/(app)/review/page.tsx`** — 今日复习页：
   - 获取 `next_review_at <= today` 的知识点
   - 随机抽取该知识点的题目进行复习
   - 答题交互复用 Task 3 的组件

5. **`app/(app)/wrong/page.tsx`** — 错题本：
   - 按章节分组显示错题
   - 支持「标记已掌握」（更新 `is_resolved = true`）
   - 支持直接对错题提问 AI

---

## 跨任务协作规范

1. **接口约定**：所有 API Route 返回格式统一为 `{ data: T | null, error: string | null }`
2. **错误处理**：API 错误统一通过 `toast.error()` 展示（使用 Shadcn Toast）
3. **加载状态**：数据加载中统一使用 `Skeleton` 组件占位（Shadcn Skeleton）
4. **类型安全**：所有数据库查询结果必须使用 `types/index.ts` 中定义的类型，不允许使用 `any`
5. **KaTeX 渲染**：所有涉及数学公式的文本，必须通过 `MathText` 组件渲染，不得直接渲染原始字符串
6. **认证检查**：所有 API Route 必须在处理逻辑前验证 Supabase session，未认证返回 401

---

## 执行顺序建议

```
第一轮（必须串行）：
  Task 1（脚手架）→ 完成后才能启动其他任务

第二轮（并行执行）：
  Task 2（认证）║ Task 3（题目组件）║ Task 5（AI系统）║ Task 6（仪表盘）
  → 四个 subagent 同时运行

第三轮（依赖前两轮）：
  Task 4（练题页面）→ 整合 Task 2、3、5 的所有组件

最终：整合测试，确保所有页面正常联动
```

---

## 数据种子（Seed Data）

Task 1 完成后，在 Supabase 中插入以下基础数据供开发测试：

```sql
-- 插入章节数据（高等数学部分，数学一）
insert into chapters (subject_id, code, name, display_order) values
  (1, 'H01', '函数、极限与连续', 1),
  (1, 'H02', '一元函数微分学', 2),
  (1, 'H03', '一元函数积分学', 3),
  (1, 'H04', '多元函数微积分', 4),
  (1, 'H05', '无穷级数', 5),
  (1, 'H06', '常微分方程', 6),
  (2, 'L01', '行列式', 7),
  (2, 'L02', '矩阵', 8),
  (2, 'L03', '向量与线性方程组', 9),
  (2, 'L04', '特征值与特征向量', 10),
  (2, 'L05', '二次型', 11),
  (3, 'P01', '随机事件与概率', 12),
  (3, 'P02', '随机变量及其分布', 13),
  (3, 'P03', '多维随机变量', 14),
  (3, 'P04', '数字特征', 15),
  (3, 'P05', '大数定律与中心极限定理', 16),
  (3, 'P06', '数理统计', 17);

-- 插入一道测试题（选择题，含 LaTeX 公式）
insert into questions (subject_id, chapter_id, type, content, options, answer, solution, source, year, pool_type, difficulty, is_published)
values (
  1, 1, 'choice',
  '设函数 $f(x) = \lim_{n \to \infty} \frac{x^{2n} - 1}{x^{2n} + 1}$，则 $f(x)$ 的间断点为',
  '{"A": "$x = 0$", "B": "$x = \\pm 1$", "C": "$x = 1$", "D": "$x = -1$"}',
  'B',
  '**解析：**\n\n当 $|x| > 1$ 时，$x^{2n} \to \infty$，故 $f(x) = 1$\n\n当 $|x| < 1$ 时，$x^{2n} \to 0$，故 $f(x) = -1$\n\n当 $x = 1$ 时，$f(1) = 0$；当 $x = -1$ 时，$f(-1) = 0$\n\n因此 $f(x)$ 在 $x = \pm 1$ 处发生跳跃间断，故选 **B**。',
  'real_exam', 2010, 'training', 3, true
);
```

---

## 完成标准

MVP 开发完成时，以下用户旅程必须完整可用：

1. ✅ 用户输入邮箱 → 收到 Magic Link → 点击 → 进入仪表盘
2. ✅ 用户设置科目（数学一）和目标年份（2027）
3. ✅ 用户进入「专题训练」→ 选择「函数极限」章节 → 看到题目 → 作答 → 查看解析
4. ✅ 答题结果正确记录到数据库，知识点掌握度更新
5. ✅ 错题自动进入错题本
6. ✅ 点击「问 AI 助教」→ 免费用户看到剩余次数 → 发送问题 → 流式收到回答
7. ✅ 仪表盘展示今日进度、知识点掌握热力图
8. ✅ 今日复习页展示待复习知识点
