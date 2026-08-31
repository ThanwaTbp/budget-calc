'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  FileText,
  KeyRound,
  Lock,
  LockKeyhole,
  NotebookPen,
  Plus,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useHydrated } from '@/hooks/useHydrated'
import { usePrivateNoteStore } from '@/features/privateNotes/store/usePrivateNoteStore'
import { PlainNoteCard } from '@/features/privateNotes/ui/PlainNoteCard'
import { PrivateNoteDialog } from '@/features/privateNotes/ui/PrivateNoteDialog'
import { SecretNoteCard } from '@/features/privateNotes/ui/SecretNoteCard'
import { VaultUnlockDialog } from '@/features/privateNotes/ui/VaultUnlockDialog'
import type {
  IPlainPrivateNote,
  IPrivateNote,
  ISecretNoteContent,
  ISecretPrivateNote,
  PrivateNoteKind,
} from '@/types/privateNotes'

type PrivateNoteFilter = 'all' | PrivateNoteKind

const VAULT_AUTO_LOCK_MILLISECONDS = 5 * 60 * 1000

export function PrivateNotesPage() {
  const isHydrated = useHydrated()
  const confirm = useConfirm()
  const notes = usePrivateNoteStore((state) => state.notes)
  const isVaultUnlocked = usePrivateNoteStore((state) => state.isVaultUnlocked)
  const onTogglePin = usePrivateNoteStore((state) => state.onTogglePin)
  const onDelete = usePrivateNoteStore((state) => state.onDelete)
  const onLockVault = usePrivateNoteStore((state) => state.onLockVault)
  const onDecryptSecret = usePrivateNoteStore((state) => state.onDecryptSecret)

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<PrivateNoteFilter>('all')
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false)
  const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<IPrivateNote | null>(null)
  const [decryptedSecrets, setDecryptedSecrets] = useState<Record<string, ISecretNoteContent>>({})

  const secretNotes = useMemo(
    () => notes.filter((note): note is ISecretPrivateNote => note.kind === 'secret'),
    [notes],
  )
  const hasExistingVault = secretNotes.length > 0

  useEffect(() => {
    if (!isVaultUnlocked) return

    let isCancelled = false
    void Promise.all(
      secretNotes.map(async (note) => [note.id, await onDecryptSecret(note)] as const),
    )
      .then((entries) => {
        if (!isCancelled) setDecryptedSecrets(Object.fromEntries(entries))
      })
      .catch(() => {
        if (!isCancelled) {
          onLockVault()
          toast.error('เปิดข้อมูลลับไม่สำเร็จ คลังถูกล็อกเพื่อความปลอดภัย')
        }
      })

    return () => {
      isCancelled = true
    }
  }, [isVaultUnlocked, onDecryptSecret, onLockVault, secretNotes])

  useEffect(
    () =>
      usePrivateNoteStore.subscribe((state, previousState) => {
        if (!state.isVaultUnlocked && previousState.isVaultUnlocked) setDecryptedSecrets({})
      }),
    [],
  )

  useEffect(
    () => () => {
      onLockVault()
    },
    [onLockVault],
  )

  useEffect(() => {
    if (!isVaultUnlocked) return

    const timeoutId = window.setTimeout(() => {
      onLockVault()
      toast.info('ล็อกคลังข้อมูลลับอัตโนมัติแล้ว')
    }, VAULT_AUTO_LOCK_MILLISECONDS)

    return () => window.clearTimeout(timeoutId)
  }, [isVaultUnlocked, onLockVault])

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th')

    return notes.filter((note) => {
      if (filter !== 'all' && note.kind !== filter) return false
      if (!normalizedQuery) return true

      if (note.kind === 'note') {
        return `${note.title} ${note.content}`.toLocaleLowerCase('th').includes(normalizedQuery)
      }

      const content = isVaultUnlocked ? decryptedSecrets[note.id] : null
      if (!content) return false
      return `${content.title} ${content.username} ${content.website} ${content.detail}`
        .toLocaleLowerCase('th')
        .includes(normalizedQuery)
    })
  }, [decryptedSecrets, filter, isVaultUnlocked, notes, query])

  const onCreateNote = () => {
    setEditingNote(null)
    setIsNoteDialogOpen(true)
  }

  const onEditPlainNote = (note: IPlainPrivateNote) => {
    setEditingNote(note)
    setIsNoteDialogOpen(true)
  }

  const onEditSecretNote = (note: ISecretPrivateNote) => {
    if (!isVaultUnlocked || !decryptedSecrets[note.id]) {
      setIsUnlockDialogOpen(true)
      return
    }
    setEditingNote(note)
    setIsNoteDialogOpen(true)
  }

  const onDeleteNote = async (note: IPrivateNote) => {
    const isConfirmed = await confirm({
      title: note.kind === 'secret' ? 'ลบข้อมูลลับนี้?' : `ลบ “${note.title}”?`,
      description: 'เมื่อลบแล้วจะไม่สามารถกู้คืนรายการนี้ได้',
      confirmLabel: 'ลบ',
      tone: 'danger',
    })
    if (!isConfirmed) return
    onDelete(note.id)
    toast.success('ลบโน้ตเรียบร้อยแล้ว')
  }

  const onNoteDialogOpenChange = (open: boolean) => {
    setIsNoteDialogOpen(open)
    if (!open) setEditingNote(null)
  }

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="โน้ตส่วนตัว" description="เก็บไอเดีย เรื่องที่ต้องจำ และข้อมูลสำคัญไว้ในที่เดียว">
        <Button size="lg" onClick={onCreateNote}>
          <Plus />
          เขียนโน้ต
        </Button>
      </PageHeader>

      {hasExistingVault && (
        <section
          className={
            isVaultUnlocked
              ? 'flex flex-col gap-4 rounded-2xl border border-income/25 bg-income-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between'
              : 'flex flex-col gap-4 rounded-2xl border border-warning/25 bg-warning-muted/35 p-4 sm:flex-row sm:items-center sm:justify-between'
          }
        >
          <div className="flex items-start gap-3">
            <span
              className={
                isVaultUnlocked
                  ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-income text-white'
                  : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning text-warning-foreground'
              }
            >
              {isVaultUnlocked ? <ShieldCheck className="size-5" /> : <LockKeyhole className="size-5" />}
            </span>
            <div>
              <p className="font-semibold">
                {isVaultUnlocked ? 'คลังข้อมูลลับปลดล็อกอยู่' : 'ข้อมูลลับถูกเข้ารหัสและล็อกไว้'}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isVaultUnlocked
                  ? 'ระบบจะล็อกอัตโนมัติภายใน 5 นาที เพื่อไม่ให้ข้อมูลเปิดค้างไว้'
                  : 'ใช้รหัสหลักเพื่อดูชื่อผู้ใช้ รหัสผ่าน และรายละเอียดที่บันทึกไว้'}
              </p>
            </div>
          </div>

          {isVaultUnlocked ? (
            <Button variant="outline" onClick={onLockVault}>
              <Lock />
              ล็อกตอนนี้
            </Button>
          ) : (
            <Button onClick={() => setIsUnlockDialogOpen(true)}>
              <KeyRound />
              ปลดล็อก
            </Button>
          )}
        </section>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={isVaultUnlocked ? 'ค้นหาหัวข้อหรือเนื้อหา...' : 'ค้นหาโน้ตทั่วไป...'}
            className="pl-9"
            aria-label="ค้นหาโน้ต"
          />
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as PrivateNoteFilter)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="all">ทั้งหมด {notes.length}</TabsTrigger>
            <TabsTrigger value="note">โน้ต {notes.length - secretNotes.length}</TabsTrigger>
            <TabsTrigger value="secret">ข้อมูลลับ {secretNotes.length}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredNotes.map((note) =>
            note.kind === 'note' ? (
              <PlainNoteCard
                key={note.id}
                note={note}
                onEdit={onEditPlainNote}
                onTogglePin={(selectedNote) => onTogglePin(selectedNote.id)}
                onDelete={onDeleteNote}
              />
            ) : (
              <SecretNoteCard
                key={note.id}
                note={note}
                content={isVaultUnlocked ? (decryptedSecrets[note.id] ?? null) : null}
                isUnlocked={isVaultUnlocked}
                onEdit={onEditSecretNote}
                onTogglePin={(selectedNote) => onTogglePin(selectedNote.id)}
                onDelete={onDeleteNote}
                onUnlock={() => setIsUnlockDialogOpen(true)}
              />
            ),
          )}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="ยังไม่มีโน้ตส่วนตัว"
          description="เริ่มจากจดสิ่งที่อยากจำ หรือเลือกข้อมูลลับเมื่อต้องเก็บรหัสผ่านและข้อมูลสำคัญ"
        >
          <Button onClick={onCreateNote}>
            <Plus />
            เขียนโน้ตแรก
          </Button>
        </EmptyState>
      ) : (
        <EmptyState
          icon={filter === 'secret' ? LockKeyhole : FileText}
          title="ไม่พบโน้ตตามที่ค้นหา"
          description={
            !isVaultUnlocked && secretNotes.length > 0
              ? 'ข้อมูลลับที่ล็อกอยู่จะยังไม่ถูกนำมาค้นหา ลองปลดล็อกหรือเปลี่ยนคำค้น'
              : 'ลองเปลี่ยนคำค้นหรือเลือกดูโน้ตประเภทอื่น'
          }
        />
      )}

      <PrivateNoteDialog
        open={isNoteDialogOpen}
        onOpenChange={onNoteDialogOpenChange}
        editingNote={editingNote}
        editingSecretContent={
          editingNote?.kind === 'secret' ? (decryptedSecrets[editingNote.id] ?? null) : null
        }
        hasExistingVault={hasExistingVault}
        isVaultUnlocked={isVaultUnlocked}
        onRequestUnlock={() => setIsUnlockDialogOpen(true)}
      />

      <VaultUnlockDialog open={isUnlockDialogOpen} onOpenChange={setIsUnlockDialogOpen} />
    </div>
  )
}
