import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sanitizeInput(input: string): string {
  if (!input) return ''
  let text = input

  /* =========================
     Normalize
  ========================= */
  text = text.trim()

  /* =========================
     Remove dangerous control chars
     (không đụng Unicode tiếng Việt)
  ========================= */
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')

  /* =========================
     Collapse whitespace
  ========================= */
  text = text.replace(/\s+/g, ' ')

  /* =========================
     Length guard (anti token bomb)
  ========================= */
  const MAX_LENGTH = 2000
  if (text.length > MAX_LENGTH) {
    text = text.slice(0, MAX_LENGTH)
  }
  return text
}

export function chunkText(
  text: string,
  chunkSize: number = 800,
  overlap: number = 150
): string[] {
  if (!text) return []

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim()

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || []

  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= chunkSize) {
      currentChunk += sentence
    } else {
      if (currentChunk.length > 50) {
        chunks.push(currentChunk.trim())
      }

      // tạo overlap
      const overlapText =
        currentChunk.slice(-overlap) || ''

      currentChunk = overlapText + sentence
    }
  }

  if (currentChunk.length > 50) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}