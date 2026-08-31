'use client'

import { MoreHorizontal, Pencil, Pin, PinOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { IPlainPrivateNote, PrivateNoteTone } from '@/types/privateNotes'

interface IPlainNoteCard {
  note: IPlainPrivateNote
  onEdit: (note: IPlainPrivateNote) => void
  onTogglePin: (note: IPlainPrivateNote) => void
  onDelete: (note: IPlainPrivateNote) => void
}

const NOTE_TONE_CLASSES: Record<PrivateNoteTone, string> = {
  neutral: 'border-border bg-card',
  warm: 'border-warning/20 bg-warning-muted/35',
  indigo: 'border-primary/15 bg-accent/55',
  green: 'border-income/20 bg-income-muted/35',
}

const updatedAtFormatter = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function PlainNoteCard({ note, onEdit, onTogglePin, onDelete }: IPlainNoteCard) {
  return (
    <article
      className={cn(
        'group flex min-h-48 flex-col rounded-2xl border p-5 shadow-sm transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-md',
        NOTE_TONE_CLASSES[note.tone],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {note.isPinned && <Pin className="size-3.5 shrink-0 fill-current text-primary" aria-label="ปักหมุดแล้ว" />}
            <h2 className="line-clamp-2 text-base font-semibold leading-snug">{note.title}</h2>
          </div>
          <span className="mt-1 block text-xs text-muted-foreground">โน้ตทั่วไป</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`ตัวเลือกสำหรับ ${note.title}`}>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onSelect={() => onEdit(note)}>
              <Pencil />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onTogglePin(note)}>
              {note.isPinned ? <PinOff /> : <Pin />}
              {note.isPinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={() => onDelete(note)}>
              <Trash2 />
              ลบโน้ต
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <button type="button" onClick={() => onEdit(note)} className="mt-4 flex flex-1 cursor-text text-left">
        <p className="line-clamp-6 whitespace-pre-wrap text-sm leading-6 text-foreground/80">
          {note.content || 'ยังไม่มีรายละเอียด'}
        </p>
      </button>

      <p className="mt-5 border-t border-foreground/8 pt-3 text-xs text-muted-foreground">
        แก้ไข {updatedAtFormatter.format(new Date(note.updatedAt))} น.
      </p>
    </article>
  )
}
