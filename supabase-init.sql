-- Kaoyan-MathTutor 数据库初始化脚本（修复版）
-- 运行前请在 Supabase Dashboard > SQL Editor 中执行

-- 0. 删除旧表（如果存在）以便重新创建
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS answer_logs CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS chapters CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP VIEW IF EXISTS user_stats CASCADE;

-- 1. 用户档案表
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  target_school TEXT,
  target_subject TEXT DEFAULT '考研数学',
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  daily_ai_quota INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 章节表
CREATE TABLE chapters (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  total_questions INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 题目表（修复：essay题的answer可为空）
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('choice', 'fill', 'essay')),
  content TEXT NOT NULL,
  options JSONB,
  answer TEXT,  -- essay题可为空
  explanation TEXT,
  solution TEXT,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  source TEXT,
  chapter_code VARCHAR(10) REFERENCES chapters(code),
  knowledge_points TEXT[],
  is_essay BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 学习进度表
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  chapter_code VARCHAR(10) REFERENCES chapters(code),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'learning', 'mastered', 'ignored')),
  ease_factor FLOAT DEFAULT 2.5,
  interval INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  times_correct INTEGER DEFAULT 0,
  times_wrong INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 5. 答题记录表
CREATE TABLE answer_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AI 对话记录表
CREATE TABLE ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  user_message TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. 用户统计视图
CREATE VIEW user_stats AS
SELECT 
  up.id as user_id,
  up.email,
  COUNT(DISTINCT CASE WHEN up2.status = 'mastered' THEN up2.question_id END) as mastered_count,
  COUNT(DISTINCT CASE WHEN up2.status = 'learning' THEN up2.question_id END) as learning_count,
  COUNT(DISTINCT up2.question_id) as total_practiced,
  COUNT(DISTINCT al.id) FILTER (WHERE DATE(al.created_at) = CURRENT_DATE) as today_questions,
  COUNT(DISTINCT al.id) FILTER (WHERE DATE(al.created_at) = CURRENT_DATE AND al.is_correct = TRUE) as today_correct
FROM user_profiles up
LEFT JOIN user_progress up2 ON up.id = up2.user_id
LEFT JOIN answer_logs al ON up.id = al.user_id
GROUP BY up.id, up.email;

-- 8. 索引优化
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_chapter ON user_progress(chapter_code);
CREATE INDEX idx_user_progress_next_review ON user_progress(next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX idx_questions_chapter ON questions(chapter_code);
CREATE INDEX idx_answer_logs_user ON answer_logs(user_id);
CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id);

-- 9. RLS 策略
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own answers" ON answer_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON answer_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own ai conversations" ON ai_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai conversations" ON ai_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 10. 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_progress_updated_at BEFORE UPDATE ON user_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11. 插入初始章节数据（高等数学）
INSERT INTO chapters (code, name, subject, level, total_questions) VALUES
('H01', '函数与极限', '高等数学', 3, 50),
('H02', '导数与微分', '高等数学', 2, 45),
('H03', '微分中值定理', '高等数学', 1, 40),
('H04', '不定积分', '高等数学', 1, 42),
('H05', '定积分', '高等数学', 2, 48),
('H06', '微分方程', '高等数学', 2, 38),
('H07', '多元函数微分学', '高等数学', 2, 44),
('H08', '重积分', '高等数学', 1, 36),
('H09', '曲线曲面积分', '高等数学', 1, 34),
('H10', '无穷级数', '高等数学', 2, 40);

-- 12. 插入初始章节数据（线性代数）
INSERT INTO chapters (code, name, subject, level, total_questions) VALUES
('X01', '行列式', '线性代数', 4, 35),
('X02', '矩阵', '线性代数', 2, 55),
('X03', '向量组', '线性代数', 1, 40),
('X04', '线性方程组', '线性代数', 3, 38),
('X05', '特征值与特征向量', '线性代数', 2, 42),
('X06', '二次型', '线性代数', 2, 36);

-- 13. 插入初始章节数据（概率论）
INSERT INTO chapters (code, name, subject, level, total_questions) VALUES
('G01', '随机事件与概率', '概率论', 3, 40),
('G02', '一维随机变量', '概率论', 2, 45),
('G03', '二维随机变量', '概率论', 1, 42),
('G04', '数字特征', '概率论', 2, 36),
('G05', '大数定律与中心极限定理', '概率论', 1, 30),
('G06', '数理统计', '概率论', 2, 38);

-- 14. 插入示例题目（选择题）
INSERT INTO questions (type, content, options, answer, explanation, difficulty, source, chapter_code, knowledge_points) VALUES
('choice', '设函数 $f(x) = \lim_{n \to \infty} \frac{x^{2n+1} + a x^2 + b x}{x^{2n} + 1}$ 在 $(-\infty, +\infty)$ 上连续，则 $a, b$ 的值为', 
 '[{"id":"A","content":"$a = 0, b = 1$"},{"id":"B","content":"$a = 1, b = 0$"},{"id":"C","content":"$a = 0, b = 0$"},{"id":"D","content":"$a = 1, b = 1$"}]',
 'C', '由连续性条件 $\lim_{x \to 1} f(x) = f(1)$ 可得 $a + b = 1$，再由 $\lim_{x \to -1} f(x) = f(-1)$ 可得 $-a + b = -1$，解得 $a = 1, b = 0$。', 
 3, '2024年真题', 'H01', ARRAY['函数极限', '连续性']),
 
('choice', '若 $\lim_{n \to \infty} a_n = A$，则 $\lim_{n \to \infty} \frac{a_1 + a_2 + ... + a_n}{n} = $',
 '[{"id":"A","content":"$A$"},{"id":"B","content":"$A/2$"},{"id":"C","content":"$2A$"},{"id":"D","content":"无法确定"}]',
 'A', '由 Stolz 定理，$\lim_{n \to \infty} \frac{S_n}{n} = \lim_{n \to \infty} \frac{S_n - S_{n-1}}{n - (n-1)} = \lim_{n \to \infty} a_n = A$。',
 3, '2023年真题', 'H01', ARRAY['数列极限', 'Stolz定理']);

-- 15. 插入示例题目（填空题）
INSERT INTO questions (type, content, answer, explanation, difficulty, source, chapter_code, knowledge_points) VALUES
('fill', '设 $f(x, y) = \begin{cases} \frac{x^2 y^2}{x^2 + y^2}, & (x, y) \neq (0, 0) \\ 0, & (x, y) = (0, 0) \end{cases}$，则 $\frac{\partial f}{\partial x}(0, 0) = $ ____________',
 '0', '按定义 $\frac{\partial f}{\partial x}(0, 0) = \lim_{\Delta x \to 0} \frac{f(\Delta x, 0) - f(0,0)}{\Delta x} = \lim_{\Delta x \to 0} \frac{0 - 0}{\Delta x} = 0$。',
 4, '2023年真题', 'H01', ARRAY['偏导数', '定义法']);

-- 16. 插入示例题目（解答题）
INSERT INTO questions (type, content, explanation, solution, difficulty, source, chapter_code, knowledge_points, is_essay) VALUES
('essay', '设 $f(x)$ 在 $[0, 1]$ 上连续，在 $(0, 1)$ 内可导，且 $f(0) = 0, f(1) = 1$。证明：存在 $\xi \in (0, 1)$ 使得 $f(\xi) = 1 - \xi$。',
 '证明思路：构造辅助函数，利用零点定理。',
 '【证明】构造辅助函数 $F(x) = f(x) - (1 - x) = f(x) + x - 1$。
由题意，$f(0) = 0, f(1) = 1$，所以：
- $F(0) = f(0) + 0 - 1 = -1 < 0$
- $F(1) = f(1) + 1 - 1 = 1 > 0$

由于 $f(x)$ 在 $[0, 1]$ 上连续，故 $F(x)$ 在 $[0, 1]$ 上连续。
由零点定理可知，存在 $\xi \in (0, 1)$ 使得 $F(\xi) = 0$，即 $f(\xi) = 1 - \xi$。证毕。',
 3, '2022年真题', 'H02', ARRAY['微分中值定理', '零点定理'], true);

SELECT 'Database initialization completed successfully!' as status;
