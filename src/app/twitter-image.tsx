import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DeepTerm - AI-Powered Study Tools'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
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
          backgroundColor: '#f6f6f6',
          padding: '60px 80px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#292929',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '32px',
              fontWeight: 'bold',
            }}
          >
            D
          </div>
          <span style={{ fontSize: '48px', color: '#292929', fontWeight: 600 }}>
            DeepTerm
          </span>
        </div>

        <h1
          style={{
            fontSize: '72px',
            fontWeight: 700,
            color: '#292929',
            textAlign: 'center',
            lineHeight: 1.1,
            margin: 0,
            marginBottom: '24px',
          }}
        >
          Study smarter,
          <br />
          <span style={{ fontStyle: 'italic' }}>not harder</span>
        </h1>

        <p
          style={{
            fontSize: '28px',
            color: '#292929',
            opacity: 0.7,
            textAlign: 'center',
            margin: 0,
            marginBottom: '40px',
            maxWidth: '800px',
          }}
        >
          Free AI-powered flashcards, practice tests & study tools
        </p>

        <div style={{ display: 'flex', gap: '16px' }}>
          {['AI-Powered', 'Free Forever', 'Open Source'].map((text) => (
            <div
              key={text}
              style={{
                backgroundColor: '#292929',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '100px',
                fontSize: '18px',
              }}
            >
              {text}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            color: '#292929',
            opacity: 0.5,
            fontSize: '20px',
          }}
        >
          deepterm.tech
        </div>
      </div>
    ),
    { ...size }
  )
}
