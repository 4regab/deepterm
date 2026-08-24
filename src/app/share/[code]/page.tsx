import { cache } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import SharePreviewClient from './SharePreviewClient'
import { siteConfig } from '@/lib/seo'
import { ShareCodeSchema } from '@/lib/schemas/sharing'
import { checkShareRateLimit, getRequestIdentifier } from '@/services/shareRateLimit'
import { hashRequestIdentity } from '@/lib/auth/requestIdentity'
import { buildSharePageMeta, parseSharedMaterial } from '@/utils/shareMetadata'

interface PageProps {
  params: Promise<{ code: string }>
}

async function loadSharedMaterialUncached(
  code: string,
  requestIdentity?: string,
  identityHash?: string,
) {
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

  // F-005: pass a peppered, non-reversible identity hash so the DB-level
  // rate limit inside get_shared_material() can throttle abuse.
  const { data, error } = await supabase.rpc('get_shared_material', {
    p_share_code: parsedCode.data,
    p_identifier_hash: identityHash ?? null,
  })

  if (error || !data) {
    return null
  }

  return parseSharedMaterial(data)
}

const loadSharedMaterial = cache(loadSharedMaterialUncached)

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { code } = await params
  const requestHeaders = await headers()
  const requestIdentity = getRequestIdentifier(requestHeaders)
  const identityHash = hashRequestIdentity(requestHeaders)
  const data = await loadSharedMaterial(code, requestIdentity, identityHash)

  if (!data) {
    return {
      title: 'Material Not Found',
      description: 'This shared material could not be found.',
    }
  }

  const { title, typeLabel: type, itemCount, description } = buildSharePageMeta(data)
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
  const identityHash = hashRequestIdentity(requestHeaders)
  const sharedData = await loadSharedMaterial(code, requestIdentity, identityHash)

  if (!sharedData) {
    notFound()
  }

  return <SharePreviewClient data={sharedData} shareCode={code} />
}
