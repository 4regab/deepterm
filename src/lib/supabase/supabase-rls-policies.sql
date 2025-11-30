-- ============================================================
-- SUPABASE ROW-LEVEL SECURITY (RLS) POLICIES
-- Run this script in Supabase SQL Editor
-- ============================================================
-- WARNING: This will restrict ALL data access to authenticated users only
-- Backup your data before running in production
-- ============================================================
-- SECURITY FIXES APPLIED:
-- 1. material_shares - restricted anonymous access (CRITICAL)
-- 2. unlimited_users - restricted anonymous access (HIGH)
-- 3. Secure share access via RPC function (HIGH)
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
ALTER TABLE material_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE unlimited_users ENABLE ROW LEVEL SECURITY;

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

-- material_shares (SECURITY FIX - CVE-EQUIVALENT: CWE-284)
DROP POLICY IF EXISTS "material_shares_anon_select" ON material_shares;
DROP POLICY IF EXISTS "material_shares_public_select" ON material_shares;
DROP POLICY IF EXISTS "Users can view own material_shares" ON material_shares;
DROP POLICY IF EXISTS "Users can insert own material_shares" ON material_shares;
DROP POLICY IF EXISTS "Users can update own material_shares" ON material_shares;
DROP POLICY IF EXISTS "Users can delete own material_shares" ON material_shares;

-- unlimited_users (SECURITY FIX - CWE-200)
DROP POLICY IF EXISTS "unlimited_users_public_select" ON unlimited_users;
DROP POLICY IF EXISTS "unlimited_users_anon_select" ON unlimited_users;
DROP POLICY IF EXISTS "Users can view own unlimited_users" ON unlimited_users;

-- Drop existing insecure RPC functions if they exist
DROP FUNCTION IF EXISTS get_shared_flashcards(text);
DROP FUNCTION IF EXISTS get_shared_flashcard_set(text);
DROP FUNCTION IF EXISTS validate_share_code(text);

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

-- ------------------------------------------------------------
-- MATERIAL_SHARES (SECURITY FIX - CRITICAL)
-- Only owners can manage their shares. No anonymous access.
-- Share code validation happens via secure RPC function.
-- ------------------------------------------------------------
CREATE POLICY "Users can view own material_shares" ON material_shares
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own material_shares" ON material_shares
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own material_shares" ON material_shares
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own material_shares" ON material_shares
    FOR DELETE USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- UNLIMITED_USERS (SECURITY FIX - HIGH)
-- Only users can check their own premium status.
-- ------------------------------------------------------------
CREATE POLICY "Users can view own unlimited_users" ON unlimited_users
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- STEP 4: SECURE RPC FUNCTIONS FOR SHARE ACCESS
-- These functions use SECURITY DEFINER to bypass RLS
-- and validate share codes securely.
-- ============================================================

-- Validate a share code and return share metadata (no sensitive data)
CREATE OR REPLACE FUNCTION validate_share_code(p_share_code text)
RETURNS TABLE (
    material_type text,
    material_id uuid,
    is_valid boolean
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ms.material_type::text,
        ms.material_id,
        true as is_valid
    FROM material_shares ms
    WHERE ms.share_code = p_share_code 
    AND ms.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get shared flashcard set by share code (secure access)
CREATE OR REPLACE FUNCTION get_shared_flashcard_set(p_share_code text)
RETURNS TABLE (
    id uuid,
    title text,
    description text,
    created_at timestamptz,
    card_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.id,
        fs.title,
        fs.description,
        fs.created_at,
        (SELECT COUNT(*) FROM flashcards f WHERE f.set_id = fs.id) as card_count
    FROM flashcard_sets fs
    JOIN material_shares ms ON ms.material_id = fs.id
    WHERE ms.share_code = p_share_code 
    AND ms.is_active = true
    AND ms.material_type = 'flashcard_set';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get shared flashcards by share code (secure access)
-- Note: Does NOT expose user study progress (status, last_reviewed)
CREATE OR REPLACE FUNCTION get_shared_flashcards(p_share_code text)
RETURNS TABLE (
    id uuid,
    term text,
    definition text,
    set_id uuid
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.term,
        f.definition,
        f.set_id
    FROM flashcards f
    JOIN flashcard_sets fs ON f.set_id = fs.id
    JOIN material_shares ms ON ms.material_id = fs.id
    WHERE ms.share_code = p_share_code 
    AND ms.is_active = true
    AND ms.material_type = 'flashcard_set';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION validate_share_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_flashcard_set(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_shared_flashcards(text) TO anon, authenticated;

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

-- Verify material_shares and unlimited_users have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('material_shares', 'unlimited_users');

-- List RPC functions for share access
SELECT proname, prosecdef 
FROM pg_proc 
WHERE proname IN ('validate_share_code', 'get_shared_flashcard_set', 'get_shared_flashcards');
