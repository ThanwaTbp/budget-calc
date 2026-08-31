import type { ISecretEnvelope } from '@/types/privateNotes'

export function isSecretEnvelope(value: unknown): value is ISecretEnvelope {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>

  return (
    candidate.version === 1 &&
    candidate.kdf === 'PBKDF2-SHA256' &&
    typeof candidate.iterations === 'number' &&
    Number.isInteger(candidate.iterations) &&
    candidate.iterations >= 100_000 &&
    candidate.iterations <= 1_000_000 &&
    typeof candidate.salt === 'string' &&
    typeof candidate.verifierIv === 'string' &&
    typeof candidate.verifierCiphertext === 'string' &&
    typeof candidate.payloadIv === 'string' &&
    typeof candidate.payloadCiphertext === 'string'
  )
}

export function parseSecretEnvelope(secretJson: string): ISecretEnvelope | null {
  try {
    const parsed: unknown = JSON.parse(secretJson)
    return isSecretEnvelope(parsed) ? parsed : null
  } catch {
    return null
  }
}
