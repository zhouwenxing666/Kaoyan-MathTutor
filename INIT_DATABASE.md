# Supabase 数据库初始化（简化版）

## 方法一：Dashboard SQL Editor（推荐，30秒完成）

1. 打开浏览器访问：
   https://supabase.com/dashboard/project/pwkxeedjvnglcxcxlyxk/sql

2. 在 SQL Editor 中：
   - 清空现有内容
   - 复制下面全部 SQL 内容粘贴进去
   - 点击 **Run** (或按 Cmd+Enter)

3. 看到 "Database initialization completed successfully!" 表示成功

## 方法二：如果您想使用 psql 直接连接

```bash
# 安装 psql (如果没有)
brew install postgresql@16

# 连接数据库
PGPASSWORD='6t5nFRrNPvnG75jz' psql \
  -h db.pwkxeedjvnglcxcxlyxk.supabase.co \
  -p 5432 \
  -U postgres \
  -d postgres

# 在 psql 终端中执行：
\i ~/Documents/Projects/Kaoyan-MathTutor/supabase-init.sql

# 或直接管道：
cat ~/Documents/Projects/Kaoyan-MathTutor/supabase-init.sql | PGPASSWORD='6t5nFRrNPvnG75jz' psql -h db.pwkxeedjvnglcxcxlyxk.supabase.co -p 5432 -U postgres -d postgres
```

## 验证是否成功

执行成功后，在 SQL Editor 运行：

```sql
SELECT subject, COUNT(*) as chapters FROM chapters GROUP BY subject;
```

预期输出：
| subject | chapters |
|---------|----------|
| 高等数学 | 10 |
| 线性代数 | 6 |
| 概率论 | 6 |

---

**supabase-init.sql 位置：**
`~/Documents/Projects/Kaoyan-MathTutor/supabase-init.sql`
