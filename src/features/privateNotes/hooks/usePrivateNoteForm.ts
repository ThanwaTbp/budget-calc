'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { usePrivateNoteStore } from '@/features/privateNotes/store/usePrivateNoteStore'
import type { IPrivateNote, ISecretNoteContent } from '@/types/privateNotes'

const privateNoteFormSchema = z.object({
  kind: z.enum(['note', 'secret']),
  title: z.string().trim().min(1, 'กรุณาใส่หัวข้อ').max(120, 'หัวข้อต้องไม่เกิน 120 ตัวอักษร'),
  content: z.string().max(5000, 'เนื้อหาต้องไม่เกิน 5,000 ตัวอักษร'),
  tone: z.enum(['neutral', 'warm', 'indigo', 'green']),
  username: z.string().max(160, 'ชื่อผู้ใช้ต้องไม่เกิน 160 ตัวอักษร'),
  password: z.string().max(512, 'รหัสผ่านต้องไม่เกิน 512 ตัวอักษร'),
  website: z.string().max(500, 'เว็บไซต์ต้องไม่เกิน 500 ตัวอักษร'),
  masterPassword: z.string(),
  confirmMasterPassword: z.string(),
})

export type IPrivateNoteFormValues = z.infer<typeof privateNoteFormSchema>

function createEmptyFormValues(): IPrivateNoteFormValues {
  return {
    kind: 'note',
    title: '',
    content: '',
    tone: 'neutral',
    username: '',
    password: '',
    website: '',
    masterPassword: '',
    confirmMasterPassword: '',
  }
}

interface IUsePrivateNoteForm {
  open: boolean
  editingNote: IPrivateNote | null
  editingSecretContent: ISecretNoteContent | null
  hasExistingVault: boolean
  isVaultUnlocked: boolean
  onSuccess: () => void
}

export function usePrivateNoteForm({
  open,
  editingNote,
  editingSecretContent,
  hasExistingVault,
  isVaultUnlocked,
  onSuccess,
}: IUsePrivateNoteForm) {
  const onCreatePlain = usePrivateNoteStore((state) => state.onCreatePlain)
  const onCreateSecret = usePrivateNoteStore((state) => state.onCreateSecret)
  const onUpdatePlain = usePrivateNoteStore((state) => state.onUpdatePlain)
  const onUpdateSecret = usePrivateNoteStore((state) => state.onUpdateSecret)

  const form = useForm<IPrivateNoteFormValues>({
    resolver: zodResolver(privateNoteFormSchema),
    defaultValues: createEmptyFormValues(),
  })

  useEffect(() => {
    if (!open) return

    if (editingNote?.kind === 'note') {
      form.reset({
        ...createEmptyFormValues(),
        kind: 'note',
        title: editingNote.title,
        content: editingNote.content,
        tone: editingNote.tone,
      })
      return
    }

    if (editingNote?.kind === 'secret' && editingSecretContent) {
      form.reset({
        ...createEmptyFormValues(),
        kind: 'secret',
        title: editingSecretContent.title,
        content: editingSecretContent.detail,
        username: editingSecretContent.username,
        password: editingSecretContent.password,
        website: editingSecretContent.website,
      })
      return
    }

    form.reset(createEmptyFormValues())
  }, [open, editingNote, editingSecretContent, form])

  const selectedKind = useWatch({ control: form.control, name: 'kind' })
  const isSecretFormLocked = selectedKind === 'secret' && hasExistingVault && !isVaultUnlocked

  const onSubmit = form.handleSubmit(async (values) => {
    if (values.kind === 'note') {
      const input = { title: values.title, content: values.content, tone: values.tone }
      if (editingNote?.kind === 'note') {
        onUpdatePlain(editingNote.id, input)
      } else {
        onCreatePlain(input)
      }
      onSuccess()
      return
    }

    if (isSecretFormLocked) {
      form.setError('root', { message: 'กรุณาปลดล็อกคลังข้อมูลลับก่อนบันทึก' })
      return
    }

    if (!hasExistingVault) {
      if (values.masterPassword.length < 12) {
        form.setError('masterPassword', { message: 'รหัสหลักต้องมีอย่างน้อย 12 ตัวอักษร' })
        return
      }
      if (values.masterPassword !== values.confirmMasterPassword) {
        form.setError('confirmMasterPassword', { message: 'รหัสหลักทั้งสองช่องไม่ตรงกัน' })
        return
      }
    }

    const secretInput: ISecretNoteContent = {
      title: values.title,
      username: values.username,
      password: values.password,
      website: values.website,
      detail: values.content,
    }

    try {
      if (editingNote?.kind === 'secret') {
        await onUpdateSecret(editingNote.id, secretInput)
      } else {
        await onCreateSecret(secretInput, hasExistingVault ? undefined : values.masterPassword)
      }
      onSuccess()
    } catch {
      form.setError('root', { message: 'เข้ารหัสข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง' })
    }
  })

  return { form, selectedKind, isSecretFormLocked, onSubmit }
}
