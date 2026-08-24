import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'DeepTerm Blog'
  const category = searchParams.get('category') || ''

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          backgroundColor: '#171d2b',
          padding: '60px',
        }}
      >
        {/* Background gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #171d2b 0%, #2a3347 50%, #171d2b 100%)',
          }}
        />
        
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.03)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-150px',
            left: '-150px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 1,
            maxWidth: '900px',
          }}
        >
          {/* Category badge */}
          {category && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <span
                style={{
                  fontSize: '18px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: 500,
                }}
              >
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontSize: title.length > 60 ? '48px' : '56px',
              fontWeight: 600,
              color: 'white',
              lineHeight: 1.2,
              margin: 0,
              marginBottom: '40px',
            }}
          >
            {title}
          </h1>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <span style={{ fontSize: '24px', color: 'white', fontWeight: 700 }}>D</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', color: 'white', fontWeight: 600 }}>
                DeepTerm
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.5)' }}>
                deepterm.tech/blog
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
