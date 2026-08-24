-- =============================================
-- BLOG SYSTEM SCHEMA FOR DEEPTERM
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Blog Categories Table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default categories
INSERT INTO blog_categories (name, slug, description) VALUES
  ('Learning Science', 'learning-science', 'Research-backed insights into how we learn and retain information'),
  ('Study Methods', 'study-methods', 'Practical techniques and strategies for effective studying'),
  ('Tools & Apps', 'tools-apps', 'Reviews and guides for AI tools, apps, and digital learning'),
  ('Student Life', 'student-life', 'Motivation, productivity, and lifestyle tips for students'),
  ('Comparisons', 'comparisons', 'Head-to-head comparisons of study tools and methods')
ON CONFLICT (slug) DO NOTHING;

-- 2. Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  meta_description VARCHAR(160),
  
  -- Category relation
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  
  -- SEO & Social
  og_image_url TEXT,
  keywords TEXT[], -- Array of keywords
  
  -- Status & Publishing
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,
  
  -- Analytics
  views INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 5,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- 3. Blog Topics Queue (for AI generation)
CREATE TABLE IF NOT EXISTS blog_topics_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic VARCHAR(500) NOT NULL,
  target_keywords TEXT[],
  target_audience TEXT,
  category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  
  -- Generation status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'generated', 'failed', 'published')),
  priority INTEGER DEFAULT 0, -- Higher = more priority
  
  -- Result tracking
  generated_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  error_message TEXT,
  attempts INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_topics_status ON blog_topics_queue(status);
CREATE INDEX IF NOT EXISTS idx_blog_topics_priority ON blog_topics_queue(priority DESC);

-- 5. Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to blog_posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- 6. Row Level Security (RLS)
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_topics_queue ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts and categories
CREATE POLICY "Public can read categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can read published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Service role has full access (for cron jobs)
CREATE POLICY "Service role full access to posts" ON blog_posts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to topics" ON blog_topics_queue
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to categories" ON blog_categories
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Helper function to get published posts with category
CREATE OR REPLACE FUNCTION get_published_posts(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0,
  p_category_slug VARCHAR DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  slug VARCHAR,
  title VARCHAR,
  excerpt TEXT,
  meta_description VARCHAR,
  category_name VARCHAR,
  category_slug VARCHAR,
  og_image_url TEXT,
  keywords TEXT[],
  views INTEGER,
  read_time_minutes INTEGER,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.excerpt,
    bp.meta_description,
    bc.name AS category_name,
    bc.slug AS category_slug,
    bp.og_image_url,
    bp.keywords,
    bp.views,
    bp.read_time_minutes,
    bp.published_at
  FROM blog_posts bp
  LEFT JOIN blog_categories bc ON bp.category_id = bc.id
  WHERE bp.status = 'published'
    AND (p_category_slug IS NULL OR bc.slug = p_category_slug)
  ORDER BY bp.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 8. Function to get single post by slug
CREATE OR REPLACE FUNCTION get_post_by_slug(p_slug VARCHAR)
RETURNS TABLE (
  id UUID,
  slug VARCHAR,
  title VARCHAR,
  excerpt TEXT,
  content TEXT,
  meta_description VARCHAR,
  category_name VARCHAR,
  category_slug VARCHAR,
  og_image_url TEXT,
  keywords TEXT[],
  views INTEGER,
  read_time_minutes INTEGER,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Increment view count
  UPDATE blog_posts SET views = views + 1 WHERE blog_posts.slug = p_slug;
  
  RETURN QUERY
  SELECT 
    bp.id,
    bp.slug,
    bp.title,
    bp.excerpt,
    bp.content,
    bp.meta_description,
    bc.name AS category_name,
    bc.slug AS category_slug,
    bp.og_image_url,
    bp.keywords,
    bp.views,
    bp.read_time_minutes,
    bp.published_at,
    bp.updated_at
  FROM blog_posts bp
  LEFT JOIN blog_categories bc ON bp.category_id = bc.id
  WHERE bp.slug = p_slug AND bp.status = 'published';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Function to get next topic from queue
CREATE OR REPLACE FUNCTION get_next_topic_for_generation()
RETURNS TABLE (
  id UUID,
  topic VARCHAR,
  target_keywords TEXT[],
  target_audience TEXT,
  category_id UUID,
  category_slug VARCHAR
) AS $$
DECLARE
  v_topic_id UUID;
BEGIN
  -- Get highest priority pending topic
  SELECT tq.id INTO v_topic_id
  FROM blog_topics_queue tq
  WHERE tq.status = 'pending'
  ORDER BY tq.priority DESC, tq.created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;
  
  IF v_topic_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Mark as generating
  UPDATE blog_topics_queue 
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
  FROM blog_topics_queue tq
  LEFT JOIN blog_categories bc ON tq.category_id = bc.id
  WHERE tq.id = v_topic_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION get_next_topic_for_generation() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_next_topic_for_generation() TO service_role;

-- 10. Function to get post count by category
CREATE OR REPLACE FUNCTION get_category_post_counts()
RETURNS TABLE (
  slug VARCHAR,
  name VARCHAR,
  description TEXT,
  post_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bc.slug,
    bc.name,
    bc.description,
    COUNT(bp.id)::BIGINT AS post_count
  FROM blog_categories bc
  LEFT JOIN blog_posts bp ON bc.id = bp.category_id AND bp.status = 'published'
  GROUP BY bc.id, bc.slug, bc.name, bc.description
  ORDER BY bc.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
