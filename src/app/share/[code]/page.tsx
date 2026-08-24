import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import SharePreviewClient from './SharePreviewClient'
import { siteConfig } from '@/lib/seo'
import { ShareCodeSchema } from '@/lib/schemas/sharing'
import { checkShareRateLimit, getRequestIdentifier } from '@/services/shareRateLimit'

interface PageProps {
  params: Promise<{ code: string }>
}

async function getSharedMaterial(code: string, requestIdentity?: string) {
  const parsedCode = ShareCodeSchema.safeParse(code)
  if (!parsedCode.success) {
    return null
  }

  if (requestIdentity) {
    const rateLimit = checkShareRateLimit('lookup', requestIdentity)
    if (!rateLimit.allowed) {
      return null
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )

  const { data, error } = await supabase.rpc('get_shared_material', { 
    p_share_code: parsedCode.data 
  })

  if (error || !data) {
    return null
  }

  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const data = await getSharedMaterial(code)

  if (!data) {
    return {
      title: 'Material Not Found',
      description: 'This shared material could not be found.',
    }
  }

  const title = data.title || 'Shared Study Material'
  const type = data.type === 'cards' ? 'Flashcards' : 'Reviewer'
  const itemCount = data.items?.length || 0
  const description = `Study ${title} - ${itemCount} ${type.toLowerCase()} on DeepTerm. Free AI-powered study tools.`
  const url = `${siteConfig.url}/share/${code}`

  return {
    title: `${title} - ${type}`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${title} - ${type} | DeepTerm`,
      description,
      url,
      siteName: siteConfig.name,
      type: 'article',
      images: [
        {
          url: `${siteConfig.url}/api/og/share?title=${encodeURIComponent(title)}&type=${type}&count=${itemCount}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - ${type}`,
      description,
      images: [`${siteConfig.url}/api/og/share?title=${encodeURIComponent(title)}&type=${type}&count=${itemCount}`],
    },
  }
}

export default async function SharePage({ params }: PageProps) {
  const { code } = await params
  const requestHeaders = await headers()
  const requestIdentity = getRequestIdentifier(requestHeaders)
  const sharedData = await getSharedMaterial(code, requestIdentity)

  if (!sharedData) {
    notFound()
  }

  return <SharePreviewClient data={sharedData} shareCode={code} />
}
