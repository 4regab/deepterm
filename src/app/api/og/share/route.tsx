import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const title = searchParams.get('title') || 'Study Material'
  const type = searchParams.get('type') || 'Flashcards'
  const count = searchParams.get('count') || '0'

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f0f0ea',
          padding: '40px 80px',
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: '#171d2b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            D
          </div>
          <span style={{ fontSize: '32px', color: '#171d2b', fontWeight: 600 }}>
            DeepTerm
          </span>
        </div>

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '900px',
          }}
        >
          {/* Type badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#171d2b',
              color: 'white',
              padding: '8px 20px',
              borderRadius: '100px',
              fontSize: '18px',
              marginBottom: '24px',
            }}
          >
            {type === 'Flashcards' ? '📚' : '📝'} {type} • {count} items
          </div>

          {/* Title */}
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#171d2b',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: '24px',
            }}
          >
            {title.length > 60 ? title.substring(0, 60) + '...' : title}
          </h1>

          {/* CTA */}
          <p
            style={{
              fontSize: '24px',
              color: '#171d2b',
              opacity: 0.7,
              margin: 0,
            }}
          >
            Study smarter with free AI-powered tools
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#171d2b',
            opacity: 0.5,
            fontSize: '18px',
          }}
        >
          deepterm.tech
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
