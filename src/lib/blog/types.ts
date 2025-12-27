// Blog system types

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  meta_description: string | null
  category_id: string | null
  og_image_url: string | null
  keywords: string[] | null
  status: 'draft' | 'scheduled' | 'published' | 'archived'
  published_at: string | null
  scheduled_for: string | null
  views: number
  read_time_minutes: number
  created_at: string
  updated_at: string
}

export interface BlogPostWithCategory extends BlogPost {
  category_name: string | null
  category_slug: string | null
}

export interface BlogPostListItem {
  id: string
  slug: string
  title: string
  excerpt: string | null
  meta_description: string | null
  category_name: string | null
  category_slug: string | null
  og_image_url: string | null
  keywords: string[] | null
  views: number
  read_time_minutes: number
  published_at: string | null
}

export interface BlogTopicQueue {
  id: string
  topic: string
  target_keywords: string[] | null
  target_audience: string | null
  category_id: string | null
  status: 'pending' | 'generating' | 'generated' | 'failed' | 'published'
  priority: number
  generated_post_id: string | null
  error_message: string | null
  attempts: number
  created_at: string
  processed_at: string | null
}

export interface CategoryWithCount {
  slug: string
  name: string
  description: string | null
  post_count: number
}
