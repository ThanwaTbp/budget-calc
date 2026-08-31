export type PrivateNoteKind = 'note' | 'secret'
export type PrivateNoteTone = 'neutral' | 'warm' | 'indigo' | 'green'

export interface ISecretEnvelope {
  version: 1
  kdf: 'PBKDF2-SHA256'
  iterations: number
  salt: string
  verifierIv: string
  verifierCiphertext: string
  payloadIv: string
  payloadCiphertext: string
}

interface IPrivateNoteBase {
  id: string
  kind: PrivateNoteKind
  isPinned: boolean
  createdAt: string
  updatedAt: string
}

export interface IPlainPrivateNote extends IPrivateNoteBase {
  kind: 'note'
  title: string
  content: string
  tone: PrivateNoteTone
}

export interface ISecretPrivateNote extends IPrivateNoteBase {
  kind: 'secret'
  secret: ISecretEnvelope
}

export type IPrivateNote = IPlainPrivateNote | ISecretPrivateNote

export interface IPlainNoteInput {
  title: string
  content: string
  tone: PrivateNoteTone
}

export interface ISecretNoteContent {
  title: string
  username: string
  password: string
  website: string
  detail: string
}
