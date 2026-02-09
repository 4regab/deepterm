-- ============================================================================
-- DeepTerm: Fix Supabase Linter Warnings
-- Date: 2026-02-09
-- ============================================================================
-- Fixes:
--   1. Multiple permissive SELECT policies on blog_posts, blog_categories,
--      and achievement_definitions (duplicate policies from schema.sql and
--      the security hardening migration).
--   2. Unindexed foreign keys on blog_topics_queue and user_achievements.
--   3. Drop confirmed-unused indexes to reduce write overhead.
--   4. Pin search_path on get_next_topic_for_generation (0011 linter warning).
--
-- NOTE: The security hardening (RLS, REVOKEs, auth guards) was already
-- applied directly in Supabase. This migration only cleans up leftovers.
--
-- NOTE: auth_leaked_password_protection is a dashboard setting, not SQL.
--   Enable it at: Supabase Dashboard > Authentication > Settings >
--   "Enable Leaked Password Protection"
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. REMOVE DUPLICATE PERMISSIVE SELECT POLICIES
-- ============================================================================
-- The original schema created policies like "Public can read published posts",
-- and the security hardening added "Allow public read for published posts".
-- Both are permissive SELECT for the same roles, causing the linter warning.
-- We keep the security-hardening versions and drop the originals.
-- ============================================================================

-- blog_posts: drop old policy, keep "Allow public read for published posts"
DROP POLICY IF EXISTS "Public can read published posts" ON blog_posts;

-- blog_categories: drop old policy, keep "Allow public read for blog_categories"
DROP POLICY IF EXISTS "Public can read categories" ON blog_categories;

-- achievement_definitions: drop old policy, keep "Allow public read for achievement_definitions"
DROP POLICY IF EXISTS "Authenticated users can view achievement definitions" ON achievement_definitions;


-- ============================================================================
-- 2. ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================
-- Supabase linter: unindexed_foreign_keys (0001)
-- Foreign keys without covering indexes hurt JOIN/DELETE performance.
-- ============================================================================

-- blog_topics_queue.category_id -> blog_categories.id
CREATE INDEX IF NOT EXISTS idx_blog_topics_queue_category_id
  ON blog_topics_queue (category_id);

-- blog_topics_queue.generated_post_id -> blog_posts.id
CREATE INDEX IF NOT EXISTS idx_blog_topics_queue_generated_post_id
  ON blog_topics_queue (generated_post_id);

-- user_achievements.achievement_id -> achievement_definitions.id
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id
  ON user_achievements (achievement_id);


-- ============================================================================
-- 3. DROP UNUSED INDEXES
-- ============================================================================
-- Supabase linter: unused_index (0005)
-- These indexes have never been used according to pg_stat_user_indexes.
-- Dropping them reduces write amplification on INSERT/UPDATE/DELETE.
--
-- If any of these are needed in the future, they can be re-created.
-- ============================================================================

DROP INDEX IF EXISTS quiz_questions_quiz_id_idx;
DROP INDEX IF EXISTS quiz_attempts_quiz_id_idx;
DROP INDEX IF EXISTS pomodoro_sessions_ended_at_idx;


-- ============================================================================
-- 4. FIX MUTABLE SEARCH_PATH ON get_next_topic_for_generation
-- ============================================================================
-- Supabase linter: function_search_path_mutable (0011)
-- SECURITY DEFINER functions without a pinned search_path are vulnerable to
-- search_path hijacking. We recreate the function with SET search_path = ''.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_next_topic_for_generation()
RETURNS TABLE (
  id UUID,
  topic VARCHAR,
  target_keywords TEXT[],
  target_audience TEXT,
  category_id UUID,
  category_slug VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_topic_id UUID;
BEGIN
  -- Get highest priority pending topic
  SELECT tq.id INTO v_topic_id
  FROM public.blog_topics_queue tq
  WHERE tq.status = 'pending'
  ORDER BY tq.priority DESC, tq.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_topic_id IS NULL THEN
    RETURN;
  END IF;

  -- Mark as generating
  UPDATE public.blog_topics_queue
  SET status = 'generating', attempts = attempts + 1
  WHERE blog_topics_queue.id = v_topic_id;

  -- Return the topic
  RETURN QUERY
  SELECT
    tq.id,
    tq.topic,
    tq.target_keywords,
    tq.target_audience,
    tq.category_id,
    bc.slug AS category_slug
  FROM public.blog_topics_queue tq
  LEFT JOIN public.blog_categories bc ON tq.category_id = bc.id
  WHERE tq.id = v_topic_id;
END;
$$;


COMMIT;
