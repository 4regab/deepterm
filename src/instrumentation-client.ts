import posthog from 'posthog-js'

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: '/ingest', // Proxy through your domain to avoid ad blockers
    ui_host: 'https://us.posthog.com',
  })
}
