# Supabase 数据库初始化指南

## 方式一：使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目 `kaoyan-math-tutor`
3. 进入 **SQL Editor**
4. 复制 `supabase-init.sql` 文件中的所有内容
5. 粘贴到 SQL Editor 并点击 **Run**

## 方式二：使用 Supabase CLI

```bash
# 安装 Supabase CLI
brew install supabase

# 登录
supabase login

# 链接项目
cd ~/Documents/Projects/Kaoyan-MathTutor
supabase link --project-ref pwkxeedjvnglcxcxlyxk

# 执行初始化 SQL
supabase db execute -f supabase-init.sql
```

## 方式三：使用 psql

从 Supabase Dashboard > Settings > Database 获取：
- Host: `db.pwkxeedjvnglcxcxlyxk.supabase.co`
- Port: `5432`
- Database: `postgres`
- User: `postgres`
- Password: [你的数据库密码]

```bash
PGPASSWORD=<your-password> psql \
  -h db.pwkxeedjvnglcxcxlyxk.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres \
  -f supabase-init.sql
```

## 初始化内容

运行后将创建：
- ✅ 7 张数据表
- ✅ 用户统计视图
- ✅ 性能索引
- ✅ 行级安全策略 (RLS)
- ✅ 22 个初始章节（高数、线代、概率论）
- ✅ 4 道示例题目

## 验证初始化

初始化成功后，运行以下 SQL 验证：

```sql
-- 检查章节数量
SELECT subject, COUNT(*) as chapters FROM chapters GROUP BY subject;

-- 检查题目数量
SELECT COUNT(*) as total_questions FROM questions;
```

预期结果：
- 高等数学: 10 章
- 线性代数: 6 章
- 概率论: 6 章
- 题目: 4 道
