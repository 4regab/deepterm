import { proxy, proxyConfig } from './proxy'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  return proxy(request)
}

export const config = proxyConfig
