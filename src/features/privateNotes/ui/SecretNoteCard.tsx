'use client'

import { useState } from 'react'
import {
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ISecretNoteContent, ISecretPrivateNote } from '@/types/privateNotes'

interface ISecretNoteCard {
  note: ISecretPrivateNote
  content: ISecretNoteContent | null
  isUnlocked: boolean
  onEdit: (note: ISecretPrivateNote) => void
  onTogglePin: (note: ISecretPrivateNote) => void
  onDelete: (note: ISecretPrivateNote) => void
  onUnlock: () => void
}

function normalizeWebsite(value: string): string | null {
  if (!value) return null
  try {
    const url = new URL(value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

const updatedAtFormatter = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function SecretNoteCard({
  note,
  content,
  isUnlocked,
  onEdit,
  onTogglePin,
  onDelete,
  onUnlock,
}: ISecretNoteCard) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const websiteUrl = content ? normalizeWebsite(content.website) : null

  const onCopyPassword = async () => {
    if (!content?.password) return
    try {
      await navigator.clipboard.writeText(content.password)
      toast.success('คัดลอกรหัสผ่านแล้ว')
    } catch {
      toast.error('คัดลอกรหัสผ่านไม่สำเร็จ')
    }
  }

  return (
    <article className="group flex min-h-64 flex-col rounded-2xl border border-primary/20 bg-[linear-gradient(145deg,var(--card),var(--accent))] p-5 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          {isUnlocked ? <KeyRound className="size-4" /> : <LockKeyhole className="size-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin className="size-3.5 shrink-0 fill-current text-primary" aria-label="ปักหมุดแล้ว" />}
            <h2 className="line-clamp-2 text-base font-semibold leading-snug">
              {content?.title || 'ข้อมูลลับถูกล็อก'}
            </h2>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">ข้อมูลเข้ารหัส</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label="ตัวเลือกข้อมูลลับ">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem disabled={!content} onSelect={() => onEdit(note)}>
              <Pencil />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onTogglePin(note)}>
              {note.isPinned ? <PinOff /> : <Pin />}
              {note.isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(note)}>
              <Trash2 />
              ลบข้อมูลลับ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isUnlocked && content ? (
        <div className="mt-4 flex flex-1 flex-col gap-3">
          {content.username && (
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">ชื่อผู้ใช้ / อีเมล</p>
              <p className="mt-0.5 truncate text-sm font-medium">{content.username}</p>
            </div>
          )}

          {content.password && (
            <div className="rounded-lg border border-border/70 bg-background/60 px-3 py-2">
              <p className="text-[11px] text-muted-foreground">รหัสผ่าน / คีย์</p>
              <div className="mt-0.5 flex items-center gap-1">
                <p className="min-w-0 flex-1 truncate font-mono text-sm">
                  {isPasswordVisible ? content.password : '•'.repeat(Math.min(Math.max(content.password.length, 8), 16))}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                  aria-label={isPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </Button>
                <Button type="button" variant="ghost" size="icon-xs" onClick={onCopyPassword} aria-label="คัดลอกรหัสผ่าน">
                  <Copy />
                </Button>
              </div>
            </div>
          )}

          {content.detail && <p className="line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-foreground/75">{content.detail}</p>}

          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              เปิดเว็บไซต์
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onUnlock}
          className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-background/40 px-4 py-6 text-center transition-colors hover:bg-background/70"
        >
          <LockKeyhole className="size-6 text-primary" />
          <span className="mt-2 text-sm font-medium">แตะเพื่อปลดล็อก</span>
          <span className="mt-1 text-xs text-muted-foreground">ชื่อและเนื้อหาถูกซ่อนไว้ทั้งหมด</span>
        </button>
      )}

      <p className="mt-5 border-t border-foreground/8 pt-3 text-xs text-muted-foreground">
        แก้ไข {updatedAtFormatter.format(new Date(note.updatedAt))} น.
      </p>
    </article>
  )
}
