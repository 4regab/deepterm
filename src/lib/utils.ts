import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Debug logging utility that only logs in development environment
 */
export function debugLog(message: string, ...args: unknown[]): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, ...args);
  }
}

/**
 * Error logging utility that only logs in development environment
 */
export function debugError(message: string, error?: unknown): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${message}`, error);
  }
}
