export function getRequestOrigin(request: Pick<Request, 'headers' | 'url'>): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const forwardedHost =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')

  const protocol = forwardedProto?.split(',')[0]?.trim()
  const host = forwardedHost?.split(',')[0]?.trim()

  if (protocol && host) {
    return `${protocol}://${host}`
  }

  if (host) {
    const fallbackProtocol = new URL(request.url).protocol.replace(/:$/, '')
    return `${fallbackProtocol}://${host}`
  }

  return new URL(request.url).origin
}
