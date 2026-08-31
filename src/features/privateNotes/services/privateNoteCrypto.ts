import type { ISecretEnvelope, ISecretNoteContent } from '@/types/privateNotes'

const PBKDF2_ITERATIONS = 600_000
const VAULT_VERIFIER = 'budget-calc-private-notes-v1'
const SALT_LENGTH = 16
const IV_LENGTH = 12

let activeVaultKey: CryptoKey | null = null
let activeVaultSalt: string | null = null

const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function toCryptoBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  return new Uint8Array(bytes)
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  return crypto.getRandomValues(new Uint8Array(length))
}

async function deriveVaultKey(
  masterPassword: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<CryptoKey> {
  const passwordMaterial = await crypto.subtle.importKey(
    'raw',
    toCryptoBytes(textEncoder.encode(masterPassword)),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    passwordMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptText(
  key: CryptoKey,
  plainText: string,
  iv: Uint8Array<ArrayBuffer>,
  additionalData?: Uint8Array<ArrayBuffer>,
) {
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    toCryptoBytes(textEncoder.encode(plainText)),
  )
  return bytesToBase64(new Uint8Array(encrypted))
}

async function decryptText(
  key: CryptoKey,
  ciphertext: string,
  iv: Uint8Array<ArrayBuffer>,
  additionalData?: Uint8Array<ArrayBuffer>,
) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv, additionalData },
    key,
    base64ToBytes(ciphertext),
  )
  return textDecoder.decode(decrypted)
}

export function isPrivateNoteCryptoSupported(): boolean {
  return typeof crypto !== 'undefined' && Boolean(crypto.subtle)
}

export function lockPrivateNoteVault(): void {
  activeVaultKey = null
  activeVaultSalt = null
}

export function hasActivePrivateNoteVault(): boolean {
  return activeVaultKey !== null
}

export async function unlockPrivateNoteVault(masterPassword: string, envelope: ISecretEnvelope): Promise<boolean> {
  try {
    const salt = base64ToBytes(envelope.salt)
    const key = await deriveVaultKey(masterPassword, salt, envelope.iterations)
    const verifier = await decryptText(key, envelope.verifierCiphertext, base64ToBytes(envelope.verifierIv))
    if (verifier !== VAULT_VERIFIER) return false

    activeVaultKey = key
    activeVaultSalt = envelope.salt
    return true
  } catch {
    return false
  }
}

async function createVault(masterPassword: string) {
  const salt = randomBytes(SALT_LENGTH)
  const verifierIv = randomBytes(IV_LENGTH)
  const key = await deriveVaultKey(masterPassword, salt, PBKDF2_ITERATIONS)
  const verifierCiphertext = await encryptText(key, VAULT_VERIFIER, verifierIv)

  activeVaultKey = key
  activeVaultSalt = bytesToBase64(salt)

  return {
    key,
    salt: activeVaultSalt,
    verifierIv: bytesToBase64(verifierIv),
    verifierCiphertext,
    iterations: PBKDF2_ITERATIONS,
  }
}

export async function encryptPrivateNoteSecret(
  noteId: string,
  content: ISecretNoteContent,
  existingEnvelope: ISecretEnvelope | null,
  masterPassword?: string,
): Promise<ISecretEnvelope> {
  let key = activeVaultKey
  let vaultMetadata:
    | Pick<ISecretEnvelope, 'salt' | 'verifierIv' | 'verifierCiphertext' | 'iterations'>
    | undefined

  if (existingEnvelope) {
    if (!key || activeVaultSalt !== existingEnvelope.salt) {
      throw new Error('VAULT_LOCKED')
    }
    vaultMetadata = existingEnvelope
  } else {
    if (!masterPassword) throw new Error('MASTER_PASSWORD_REQUIRED')
    vaultMetadata = await createVault(masterPassword)
    key = activeVaultKey
  }

  if (!key || !vaultMetadata) throw new Error('CRYPTO_UNAVAILABLE')

  const payloadIv = randomBytes(IV_LENGTH)
  const payloadCiphertext = await encryptText(
    key,
    JSON.stringify(content),
    payloadIv,
    toCryptoBytes(textEncoder.encode(noteId)),
  )

  return {
    version: 1,
    kdf: 'PBKDF2-SHA256',
    iterations: vaultMetadata.iterations,
    salt: vaultMetadata.salt,
    verifierIv: vaultMetadata.verifierIv,
    verifierCiphertext: vaultMetadata.verifierCiphertext,
    payloadIv: bytesToBase64(payloadIv),
    payloadCiphertext,
  }
}

export async function decryptPrivateNoteSecret(
  noteId: string,
  envelope: ISecretEnvelope,
): Promise<ISecretNoteContent> {
  if (!activeVaultKey || activeVaultSalt !== envelope.salt) {
    throw new Error('VAULT_LOCKED')
  }

  const decrypted = await decryptText(
    activeVaultKey,
    envelope.payloadCiphertext,
    base64ToBytes(envelope.payloadIv),
    toCryptoBytes(textEncoder.encode(noteId)),
  )
  const parsed: unknown = JSON.parse(decrypted)
  if (typeof parsed !== 'object' || parsed === null) throw new Error('INVALID_SECRET')
  const candidate = parsed as Record<string, unknown>

  if (
    typeof candidate.title !== 'string' ||
    typeof candidate.username !== 'string' ||
    typeof candidate.password !== 'string' ||
    typeof candidate.website !== 'string' ||
    typeof candidate.detail !== 'string'
  ) {
    throw new Error('INVALID_SECRET')
  }

  return {
    title: candidate.title,
    username: candidate.username,
    password: candidate.password,
    website: candidate.website,
    detail: candidate.detail,
  }
}
