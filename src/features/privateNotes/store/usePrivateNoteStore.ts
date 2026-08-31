import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import { createId } from '@/utils/id'
import { enqueueSyncOperation } from '@/features/sync/services/syncQueue'
import {
  decryptPrivateNoteSecret,
  encryptPrivateNoteSecret,
  lockPrivateNoteVault,
  unlockPrivateNoteVault,
} from '@/features/privateNotes/services/privateNoteCrypto'
import type {
  IPlainNoteInput,
  IPlainPrivateNote,
  IPrivateNote,
  ISecretNoteContent,
  ISecretPrivateNote,
} from '@/types/privateNotes'

interface IPrivateNoteStore {
  notes: IPrivateNote[]
  isVaultUnlocked: boolean
  onCreatePlain: (input: IPlainNoteInput) => void
  onCreateSecret: (input: ISecretNoteContent, masterPassword?: string) => Promise<void>
  onUpdatePlain: (id: string, input: IPlainNoteInput) => void
  onUpdateSecret: (id: string, input: ISecretNoteContent) => Promise<void>
  onTogglePin: (id: string) => void
  onDelete: (id: string) => void
  onUnlockVault: (masterPassword: string) => Promise<boolean>
  onLockVault: () => void
  onDecryptSecret: (note: ISecretPrivateNote) => Promise<ISecretNoteContent>
  onReset: () => void
  onReplaceAll: (notes: IPrivateNote[]) => void
}

function sortNotes(notes: IPrivateNote[]): IPrivateNote[] {
  return [...notes].sort((firstNote, secondNote) => {
    if (firstNote.isPinned !== secondNote.isPinned) return firstNote.isPinned ? -1 : 1
    return secondNote.updatedAt.localeCompare(firstNote.updatedAt)
  })
}

export const usePrivateNoteStore = create<IPrivateNoteStore>()(
  persist(
    (set, get) => ({
      notes: [],
      isVaultUnlocked: false,

      onCreatePlain: (input) => {
        const timestamp = new Date().toISOString()
        const note: IPlainPrivateNote = {
          ...input,
          id: createId(),
          kind: 'note',
          isPinned: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        set((state) => ({ notes: sortNotes([...state.notes, note]) }))
        enqueueSyncOperation({ kind: 'privateNote', action: 'upsert', id: note.id, payload: note })
      },

      onCreateSecret: async (input, masterPassword) => {
        const existingSecret = get().notes.find((note): note is ISecretPrivateNote => note.kind === 'secret') ?? null
        const timestamp = new Date().toISOString()
        const noteId = createId()
        const secret = await encryptPrivateNoteSecret(noteId, input, existingSecret?.secret ?? null, masterPassword)
        const note: ISecretPrivateNote = {
          id: noteId,
          kind: 'secret',
          secret,
          isPinned: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        }

        set((state) => ({ notes: sortNotes([...state.notes, note]), isVaultUnlocked: true }))
        enqueueSyncOperation({ kind: 'privateNote', action: 'upsert', id: note.id, payload: note })
      },

      onUpdatePlain: (id, input) => {
        let updatedNote: IPlainPrivateNote | null = null
        set((state) => ({
          notes: sortNotes(
            state.notes.map((note) => {
              if (note.id !== id || note.kind !== 'note') return note
              updatedNote = { ...note, ...input, updatedAt: new Date().toISOString() }
              return updatedNote
            }),
          ),
        }))

        if (updatedNote) {
          enqueueSyncOperation({ kind: 'privateNote', action: 'upsert', id, payload: updatedNote })
        }
      },

      onUpdateSecret: async (id, input) => {
        const existingNote = get().notes.find(
          (note): note is ISecretPrivateNote => note.id === id && note.kind === 'secret',
        )
        if (!existingNote) return

        const secret = await encryptPrivateNoteSecret(id, input, existingNote.secret)
        const updatedNote: ISecretPrivateNote = {
          ...existingNote,
          secret,
          updatedAt: new Date().toISOString(),
        }

        set((state) => ({
          notes: sortNotes(state.notes.map((note) => (note.id === id ? updatedNote : note))),
        }))
        enqueueSyncOperation({ kind: 'privateNote', action: 'upsert', id, payload: updatedNote })
      },

      onTogglePin: (id) => {
        let updatedNote: IPrivateNote | null = null
        set((state) => ({
          notes: sortNotes(
            state.notes.map((note) => {
              if (note.id !== id) return note
              updatedNote = { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() }
              return updatedNote
            }),
          ),
        }))

        if (updatedNote) {
          enqueueSyncOperation({ kind: 'privateNote', action: 'upsert', id, payload: updatedNote })
        }
      },

      onDelete: (id) => {
        const deletedNote = get().notes.find((note) => note.id === id)
        const remainingNotes = get().notes.filter((note) => note.id !== id)
        const deletedLastSecret =
          deletedNote?.kind === 'secret' && !remainingNotes.some((note) => note.kind === 'secret')

        if (deletedLastSecret) lockPrivateNoteVault()
        set({ notes: remainingNotes, isVaultUnlocked: deletedLastSecret ? false : get().isVaultUnlocked })
        enqueueSyncOperation({ kind: 'privateNote', action: 'delete', id })
      },

      onUnlockVault: async (masterPassword) => {
        const secretNote = get().notes.find((note): note is ISecretPrivateNote => note.kind === 'secret')
        if (!secretNote) return false

        const isUnlocked = await unlockPrivateNoteVault(masterPassword, secretNote.secret)
        set({ isVaultUnlocked: isUnlocked })
        return isUnlocked
      },

      onLockVault: () => {
        lockPrivateNoteVault()
        set({ isVaultUnlocked: false })
      },

      onDecryptSecret: (note) => decryptPrivateNoteSecret(note.id, note.secret),

      onReset: () => {
        lockPrivateNoteVault()
        set({ notes: [], isVaultUnlocked: false })
      },

      onReplaceAll: (notes) => {
        lockPrivateNoteVault()
        set({ notes: sortNotes(notes), isVaultUnlocked: false })
      },
    }),
    {
      name: 'budget-calc:private-notes',
      storage: userScopedStorage,
      version: 1,
      partialize: (state) => ({ notes: state.notes, isVaultUnlocked: false }),
      onRehydrateStorage: () => () => {
        lockPrivateNoteVault()
      },
    },
  ),
)
