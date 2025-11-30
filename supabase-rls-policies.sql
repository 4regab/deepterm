-- ============================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- Run this script in Supabase SQL Editor
-- ============================================================
-- WARNING: This will restrict ALL data access to authenticated users only
-- Backup your data before running in production
-- ============================================================

-- ============================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: DROP EXISTING POLICIES (if any) TO AVOID CONFLICTS
-- ============================================================

-- flashcards
DROP POLICY IF EXISTS "Users can view own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can insert own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can update own flashcards" ON flashcards;
DROP POLICY IF EXISTS "Users can delete own flashcards" ON flashcards;

-- flashcard_sets
DROP POLICY IF EXISTS "Users can view own flashcard_sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can insert own flashcard_sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can update own flashcard_sets" ON flashcard_sets;
DROP POLICY IF EXISTS "Users can delete own flashcard_sets" ON flashcard_sets;

-- reviewers
DROP POLICY IF EXISTS "Users can view own reviewers" ON reviewers;
DROP POLICY IF EXISTS "Users can insert own reviewers" ON reviewers;
DROP POLICY IF EXISTS "Users can update own reviewers" ON reviewers;
DROP POLICY IF EXISTS "Users can delete own reviewers" ON reviewers;


-- reviewer_terms
DROP POLICY IF EXISTS "Users can view own reviewer_terms" ON reviewer_terms;
DROP POLICY IF EXISTS "Users can insert own reviewer_terms" ON reviewer_terms;
DROP POLICY IF EXISTS "Users can update own reviewer_terms" ON reviewer_terms;
DROP POLICY IF EXISTS "Users can delete own reviewer_terms" ON reviewer_terms;

-- reviewer_categories
DROP POLICY IF EXISTS "Users can view own reviewer_categories" ON reviewer_categories;
DROP POLICY IF EXISTS "Users can insert own reviewer_categories" ON reviewer_categories;
DROP POLICY IF EXISTS "Users can update own reviewer_categories" ON reviewer_categories;
DROP POLICY IF EXISTS "Users can delete own reviewer_categories" ON reviewer_categories;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- pomodoro_sessions
DROP POLICY IF EXISTS "Users can view own pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can insert own pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can update own pomodoro_sessions" ON pomodoro_sessions;
DROP POLICY IF EXISTS "Users can delete own pomodoro_sessions" ON pomodoro_sessions;

-- user_stats
DROP POLICY IF EXISTS "Users can view own user_stats" ON user_stats;
DROP POLICY IF EXISTS "Users can insert own user_stats" ON user_stats;
DROP POLICY IF EXISTS "Users can update own user_stats" ON user_stats;

-- user_achievements
DROP POLICY IF EXISTS "Users can view own user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can insert own user_achievements" ON user_achievements;
DROP POLICY IF EXISTS "Users can update own user_achievements" ON user_achievements;

-- study_activity
DROP POLICY IF EXISTS "Users can view own study_activity" ON study_activity;
DROP POLICY IF EXISTS "Users can insert own study_activity" ON study_activity;
DROP POLICY IF EXISTS "Users can update own study_activity" ON study_activity;
DROP POLICY IF EXISTS "Users can delete own study_activity" ON study_activity;

-- materials
DROP POLICY IF EXISTS "Users can view own materials" ON materials;
DROP POLICY IF EXISTS "Users can insert own materials" ON materials;
DROP POLICY IF EXISTS "Users can update own materials" ON materials;
DROP POLICY IF EXISTS "Users can delete own materials" ON materials;

-- quizzes
DROP POLICY IF EXISTS "Users can view own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can insert own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;

-- quiz_questions
DROP POLICY IF EXISTS "Users can view own quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can insert own quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can update own quiz_questions" ON quiz_questions;
DROP POLICY IF EXISTS "Users can delete own quiz_questions" ON quiz_questions;

-- quiz_attempts
DROP POLICY IF EXISTS "Users can view own quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert own quiz_attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update own quiz_attempts" ON quiz_attempts;

-- ============================================================
-- STEP 3: CREATE RLS POLICIES FOR EACH TABLE
-- ============================================================

-- ------------------------------------------------------------
-- FLASHCARDS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own flashcards" ON flashcards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcards" ON flashcards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcards" ON flashcards
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcards" ON flashcards
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- FLASHCARD_SETS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own flashcard_sets" ON flashcard_sets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard_sets" ON flashcard_sets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard_sets" ON flashcard_sets
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard_sets" ON flashcard_sets
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- REVIEWERS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own reviewers" ON reviewers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviewers" ON reviewers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviewers" ON reviewers
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviewers" ON reviewers
    FOR DELETE USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- REVIEWER_TERMS (has user_id column directly)
-- ------------------------------------------------------------
CREATE POLICY "Users can view own reviewer_terms" ON reviewer_terms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviewer_terms" ON reviewer_terms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviewer_terms" ON reviewer_terms
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviewer_terms" ON reviewer_terms
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- REVIEWER_CATEGORIES (has user_id column directly)
-- ------------------------------------------------------------
CREATE POLICY "Users can view own reviewer_categories" ON reviewer_categories
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviewer_categories" ON reviewer_categories
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviewer_categories" ON reviewer_categories
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviewer_categories" ON reviewer_categories
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- PROFILES
-- ------------------------------------------------------------
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------
-- POMODORO_SESSIONS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own pomodoro_sessions" ON pomodoro_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pomodoro_sessions" ON pomodoro_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pomodoro_sessions" ON pomodoro_sessions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pomodoro_sessions" ON pomodoro_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- USER_STATS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own user_stats" ON user_stats
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_stats" ON user_stats
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_stats" ON user_stats
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- USER_ACHIEVEMENTS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own user_achievements" ON user_achievements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_achievements" ON user_achievements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_achievements" ON user_achievements
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------
-- STUDY_ACTIVITY
-- ------------------------------------------------------------
CREATE POLICY "Users can view own study_activity" ON study_activity
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study_activity" ON study_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own study_activity" ON study_activity
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own study_activity" ON study_activity
    FOR DELETE USING (auth.uid() = user_id);


-- ------------------------------------------------------------
-- MATERIALS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own materials" ON materials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own materials" ON materials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own materials" ON materials
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own materials" ON materials
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- QUIZZES
-- ------------------------------------------------------------
CREATE POLICY "Users can view own quizzes" ON quizzes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes" ON quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes" ON quizzes
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes" ON quizzes
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- QUIZ_QUESTIONS (has user_id column directly)
-- ------------------------------------------------------------
CREATE POLICY "Users can view own quiz_questions" ON quiz_questions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz_questions" ON quiz_questions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz_questions" ON quiz_questions
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz_questions" ON quiz_questions
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- QUIZ_ATTEMPTS
-- ------------------------------------------------------------
CREATE POLICY "Users can view own quiz_attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz_attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz_attempts" ON quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- VERIFICATION QUERIES
-- Run these after applying policies to verify RLS is enabled
-- ============================================================

-- Check RLS status on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'flashcards', 'flashcard_sets', 'reviewers', 'reviewer_terms',
    'reviewer_categories', 'profiles', 'pomodoro_sessions', 'user_stats',
    'user_achievements', 'study_activity', 'materials', 'quizzes',
    'quiz_questions', 'quiz_attempts'
);

-- List all policies
SELECT tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
