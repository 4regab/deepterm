import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import SharePreviewClient from './SharePreviewClient'

interface PageProps {
  params: Promise<{ code: string }>
}

async function getSharedMaterial(code: string) {
  // Use anon client for public access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data, error } = await supabase.rpc('get_shared_material', { 
    p_share_code: code 
  })

  if (error || !data) {
    return null
  }

  return data
}

export default async function SharePage({ params }: PageProps) {
  const { code } = await params
  const sharedData = await getSharedMaterial(code)

  if (!sharedData) {
    notFound()
  }

  return <SharePreviewClient data={sharedData} shareCode={code} />
}
