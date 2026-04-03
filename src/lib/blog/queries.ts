import { createClient } from '@supabase/supabase-js'
import type {
  BlogPostListItem,
  BlogPostWithCategory,
  CategoryWithCount,
  BlogCategory
} from './types'

// Create a public client for blog reads (no auth needed)
function getPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function getPublishedPosts(
  limit = 10,
  offset = 0,
  categorySlug?: string
): Promise<BlogPostListItem[]> {
  const supabase = getPublicClient()

  const { data, error } = await supabase.rpc('get_published_posts', {
    p_limit: limit,
    p_offset: offset,
    p_category_slug: categorySlug || null,
  })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data || []
}

export async function getPostBySlug(
  slug: string
): Promise<BlogPostWithCategory | null> {
  const supabase = getPublicClient()

  // Try RPC first, fallback to direct query
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_post_by_slug', {
    p_slug: slug,
  })

  if (!rpcError && rpcData?.[0]) {
    return rpcData[0]
  }

  // Fallback: direct query
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      content,
      meta_description,
      og_image_url,
      keywords,
      views,
      read_time_minutes,
      published_at,
      updated_at,
      blog_categories(name, slug)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  if (!data) return null

  // Transform to match BlogPostWithCategory
  // blog_categories can be an array or single object depending on the join
  const categoryData = data.blog_categories as { name: string; slug: string }[] | { name: string; slug: string } | null
  const category = Array.isArray(categoryData) ? categoryData[0] : categoryData

  return {
    id: data.id,
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    content: data.content,
    meta_description: data.meta_description,
    category_id: null,
    category_name: category?.name || null,
    category_slug: category?.slug || null,
    og_image_url: data.og_image_url,
    keywords: data.keywords,
    status: 'published',
    published_at: data.published_at,
    scheduled_for: null,
    views: data.views,
    read_time_minutes: data.read_time_minutes,
    created_at: data.published_at || '',
    updated_at: data.updated_at,
  }
}


export async function getCategories(): Promise<BlogCategory[]> {
  const supabase = getPublicClient()

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  return data || []
}

export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  const supabase = getPublicClient()

  const { data, error } = await supabase.rpc('get_category_post_counts')

  if (error) {
    console.error('Error fetching category counts:', error)
    return []
  }

  return data || []
}

export async function getCategoryBySlug(
  slug: string
): Promise<BlogCategory | null> {
  const supabase = getPublicClient()

  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

export async function getRelatedPosts(
  currentSlug: string,
  categorySlug: string | null,
  limit = 3
): Promise<BlogPostListItem[]> {
  const supabase = getPublicClient()

  let query = supabase
    .from('blog_posts')
    .select(`
      id,
      slug,
      title,
      excerpt,
      meta_description,
      og_image_url,
      keywords,
      views,
      read_time_minutes,
      published_at,
      blog_categories!inner(name, slug)
    `)
    .eq('status', 'published')
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(limit)

  if (categorySlug) {
    query = query.eq('blog_categories.slug', categorySlug)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching related posts:', error)
    return []
  }

  // Transform the data to match BlogPostListItem
  return (data || []).map((post: Record<string, unknown>) => ({
    id: post.id as string,
    slug: post.slug as string,
    title: post.title as string,
    excerpt: post.excerpt as string | null,
    meta_description: post.meta_description as string | null,
    category_name: (post.blog_categories as Record<string, string>)?.name || null,
    category_slug: (post.blog_categories as Record<string, string>)?.slug || null,
    og_image_url: post.og_image_url as string | null,
    keywords: post.keywords as string[] | null,
    views: post.views as number,
    read_time_minutes: post.read_time_minutes as number,
    published_at: post.published_at as string | null,
  }))
}

export async function getTotalPostCount(categorySlug?: string): Promise<number> {
  const supabase = getPublicClient()

  let query = supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published')

  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug)
    if (category) {
      query = query.eq('category_id', category.id)
    }
  }

  const { count, error } = await query

  if (error) {
    console.error('Error fetching post count:', error)
    return 0
  }

  return count || 0
}

// For sitemap generation
export async function getAllPublishedSlugs(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = getPublicClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching slugs:', error)
    return []
  }

  return data || []
}


// Get adjacent posts (previous and next) based on published_at
export async function getAdjacentPosts(
  currentPublishedAt: string
): Promise<{ prev: { slug: string; title: string } | null; next: { slug: string; title: string } | null }> {
  const supabase = getPublicClient()

  // Get previous post (older)
  const { data: prevData } = await supabase
    .from('blog_posts')
    .select('slug, title')
    .eq('status', 'published')
    .lt('published_at', currentPublishedAt)
    .order('published_at', { ascending: false })
    .limit(1)
    .single()

  // Get next post (newer)
  const { data: nextData } = await supabase
    .from('blog_posts')
    .select('slug, title')
    .eq('status', 'published')
    .gt('published_at', currentPublishedAt)
    .order('published_at', { ascending: true })
    .limit(1)
    .single()

  return {
    prev: prevData ? { slug: prevData.slug, title: prevData.title } : null,
    next: nextData ? { slug: nextData.slug, title: nextData.title } : null,
  }
}
