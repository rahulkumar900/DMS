import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseFileUrls(fileUrl: string | string[] | null | undefined): string[] {
  if (!fileUrl) return []
  if (Array.isArray(fileUrl)) return fileUrl
  
  try {
    const parsed = JSON.parse(fileUrl)
    if (Array.isArray(parsed)) return parsed
  } catch (e) {
    // Not JSON, assume single URL or comma-separated
  }
  
  return typeof fileUrl === 'string' 
    ? fileUrl.split(',').map(u => u.trim()).filter(Boolean)
    : []
}
