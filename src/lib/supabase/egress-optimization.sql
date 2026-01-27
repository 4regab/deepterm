-- ============================================
-- EGRESS OPTIMIZATION RPC FUNCTIONS
-- Add these to your Supabase database via SQL Editor
-- ============================================

-- ============================================
-- 1. BATCHED DASHBOARD DATA
-- Replaces 3 separate queries (profile, xp_stats, user_stats)
-- with a single RPC call. ~60-70% egress reduction for dashboard.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_dashboard_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result json;
  v_profile record;
  v_xp record;
  v_stats record;
  v_user record;
  v_today_minutes integer := 0;
  v_real_streak integer := 0;
BEGIN
  -- Fail fast if no authenticated user
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  -- Get profile data
  SELECT full_name, email, avatar_url 
  INTO v_profile
  FROM public.profiles 
  WHERE id = v_user_id;
  
  -- Get XP stats (uses existing function logic)
  SELECT 
    COALESCE(us.total_xp, 0) as total_xp,
    COALESCE(us.current_level, 1) as current_level,
    public.get_xp_in_current_level(COALESCE(us.total_xp, 0)) as xp_in_level,
    public.get_xp_for_level(COALESCE(us.current_level, 1)) as xp_for_next
  INTO v_xp
  FROM public.user_stats us 
  WHERE us.user_id = v_user_id;
  
  -- Get user stats
  SELECT 
    COALESCE(total_study_minutes, 0) as total_study_minutes,
    COALESCE(current_streak, 0) as current_streak,
    COALESCE(longest_streak, 0) as longest_streak,
    COALESCE(pomodoro_sessions, 0) as pomodoro_sessions,
    COALESCE(flashcards_mastered, 0) as flashcards_mastered,
    COALESCE(quizzes_completed, 0) as quizzes_completed,
    last_study_date
  INTO v_stats
  FROM public.user_stats 
  WHERE user_id = v_user_id;

  -- Get user metadata for fallback avatar/name
  SELECT raw_user_meta_data INTO v_user
  FROM auth.users WHERE id = v_user_id;

  -- Get TODAY's study minutes - use subquery to properly handle no rows
  -- When no row exists for today, the subquery returns NULL, then COALESCE converts to 0
  SELECT COALESCE(
    (SELECT sa.minutes_studied 
     FROM public.study_activity sa
     WHERE sa.user_id = v_user_id AND sa.activity_date = current_date),
    0
  ) INTO v_today_minutes;

  -- Calculate REAL current streak at read time
  -- Streak is 0 if user hasn't studied today or yesterday (streak broken)
  IF v_stats.last_study_date IS NULL THEN
    v_real_streak := 0;
  ELSIF v_stats.last_study_date >= current_date - interval '1 day' THEN
    v_real_streak := COALESCE(v_stats.current_streak, 0);
  ELSE
    v_real_streak := 0;
  END IF;

  -- Build combined result
  SELECT json_build_object(
    'profile', json_build_object(
      'full_name', COALESCE(v_profile.full_name, v_user.raw_user_meta_data->>'full_name', v_user.raw_user_meta_data->>'name'),
      'email', v_profile.email,
      'avatar_url', COALESCE(v_profile.avatar_url, v_user.raw_user_meta_data->>'avatar_url', v_user.raw_user_meta_data->>'picture')
    ),
    'xp', json_build_object(
      'total_xp', COALESCE(v_xp.total_xp, 0),
      'current_level', COALESCE(v_xp.current_level, 1),
      'xp_in_level', COALESCE(v_xp.xp_in_level, 0),
      'xp_for_next', COALESCE(v_xp.xp_for_next, 100)
    ),
    'stats', json_build_object(
      'total_study_minutes', COALESCE(v_stats.total_study_minutes, 0),
      'today_study_minutes', v_today_minutes,
      'current_streak', v_real_streak,
      'longest_streak', COALESCE(v_stats.longest_streak, 0),
      'pomodoro_sessions', COALESCE(v_stats.pomodoro_sessions, 0),
      'flashcards_mastered', COALESCE(v_stats.flashcards_mastered, 0),
      'quizzes_completed', COALESCE(v_stats.quizzes_completed, 0),
      'last_study_date', v_stats.last_study_date
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_dashboard_data() TO authenticated;


-- ============================================
-- 2. BATCHED ACTIVITY LOGGING
-- Combines pomodoro logging, activity recording, XP awarding
-- into a single atomic operation. Reduces 3-4 network calls to 1.
-- ============================================

CREATE OR REPLACE FUNCTION public.log_completed_activity(
  p_activity_type text,
  p_data jsonb DEFAULT '{}'::jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_xp_amount integer := 0;
  v_result json;
  v_local_date date;
  v_xp_result record;
BEGIN
  -- Validate user
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get local date from input or use current
  v_local_date := COALESCE((p_data->>'local_date')::date, current_date);
  
  -- Validate activity type
  IF p_activity_type NOT IN ('pomodoro', 'quiz', 'flashcard_review', 'flashcard_mastered') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid activity type');
  END IF;
  
  -- Handle each activity type
  CASE p_activity_type
    WHEN 'pomodoro' THEN
      v_xp_amount := 15;
      
      -- Insert pomodoro session
      INSERT INTO public.pomodoro_sessions (
        user_id, 
        phase, 
        duration_minutes, 
        started_at, 
        completed
      ) VALUES (
        v_user_id,
        COALESCE(p_data->>'phase', 'work'),
        COALESCE((p_data->>'duration_minutes')::integer, 25),
        COALESCE((p_data->>'started_at')::timestamptz, now()),
        true
      );
      
      -- Record study activity (only for work phase)
      IF COALESCE(p_data->>'phase', 'work') = 'work' THEN
        PERFORM public.record_study_activity(
          COALESCE((p_data->>'duration_minutes')::integer, 25),
          0, 0, 1, v_local_date
        );
      END IF;
      
    WHEN 'quiz' THEN
      v_xp_amount := 20;
      
      -- Record study activity
      PERFORM public.record_study_activity(0, 0, 1, 0, v_local_date);
      
      -- Bonus XP for perfect score
      IF (p_data->>'percentage')::integer = 100 THEN
        PERFORM public.increment_stat('perfect_quizzes', 1);
        v_xp_amount := 50;
      END IF;
      
    WHEN 'flashcard_review' THEN
      -- 1 XP per card reviewed, max 10
      v_xp_amount := LEAST(COALESCE((p_data->>'count')::integer, 1), 10);
      
      -- Record study activity
      PERFORM public.record_study_activity(
        COALESCE((p_data->>'minutes')::integer, 0),
        COALESCE((p_data->>'count')::integer, 0),
        0, 0, v_local_date
      );
      
    WHEN 'flashcard_mastered' THEN
      -- 25 XP per mastered card
      v_xp_amount := COALESCE((p_data->>'count')::integer, 1) * 25;
      
      -- Increment mastered stat
      PERFORM public.increment_stat('flashcards_mastered', COALESCE((p_data->>'count')::integer, 1));
  END CASE;
  
  -- Add XP (clamp to valid range)
  IF v_xp_amount > 0 THEN
    v_xp_amount := LEAST(v_xp_amount, 100);
    SELECT * INTO v_xp_result FROM public.add_xp(v_xp_amount);
  END IF;
  
  -- Build result
  SELECT json_build_object(
    'success', true,
    'xp_awarded', v_xp_amount,
    'leveled_up', COALESCE(v_xp_result.leveled_up, false),
    'new_level', v_xp_result.new_level,
    'new_total_xp', v_xp_result.new_total_xp
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_completed_activity(text, jsonb) TO authenticated;

-- ============================================
-- 3. OPTIMIZED MATERIALS COUNT
-- Single query to get counts for all material types.
-- Used on materials page to avoid multiple COUNT queries.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_materials_counts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result json;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT json_build_object(
    'materials', (SELECT COUNT(*) FROM public.materials WHERE user_id = v_user_id),
    'flashcard_sets', (SELECT COUNT(*) FROM public.flashcard_sets WHERE user_id = v_user_id),
    'quizzes', (SELECT COUNT(*) FROM public.quizzes WHERE user_id = v_user_id),
    'reviewers', (SELECT COUNT(*) FROM public.reviewers WHERE user_id = v_user_id)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_materials_counts() TO authenticated;

-- ============================================
-- 4. SIDEBAR DATA (for navigation)
-- Gets recent items for sidebar quick access.
-- ============================================

CREATE OR REPLACE FUNCTION public.get_sidebar_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_result json;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT json_build_object(
    'recent_sets', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title,
        'color', color
      ) ORDER BY COALESCE(last_studied, created_at) DESC), '[]'::json)
      FROM (
        SELECT id, title, color, last_studied, created_at
        FROM public.flashcard_sets 
        WHERE user_id = v_user_id
        LIMIT 5
      ) recent_fs
    ),
    'recent_quizzes', (
      SELECT COALESCE(json_agg(json_build_object(
        'id', id,
        'title', title
      ) ORDER BY updated_at DESC), '[]'::json)
      FROM (
        SELECT id, title, updated_at
        FROM public.quizzes 
        WHERE user_id = v_user_id
        LIMIT 5
      ) recent_q
    ),
    'xp_summary', (
      SELECT json_build_object(
        'level', COALESCE(current_level, 1),
        'xp', COALESCE(total_xp, 0)
      )
      FROM public.user_stats WHERE user_id = v_user_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_sidebar_data() TO authenticated;

-- ============================================
-- END OF EGRESS OPTIMIZATION RPC FUNCTIONS
-- ============================================
