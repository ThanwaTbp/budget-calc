'use client'

import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { Eye, EyeOff, KeyRound, LockKeyhole, NotebookPen, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { usePrivateNoteForm } from '@/features/privateNotes/hooks/usePrivateNoteForm'
import { cn } from '@/lib/utils'
import type { IPrivateNote, ISecretNoteContent, PrivateNoteTone } from '@/types/privateNotes'

interface IPrivateNoteDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingNote: IPrivateNote | null
  editingSecretContent: ISecretNoteContent | null
  hasExistingVault: boolean
  isVaultUnlocked: boolean
  onRequestUnlock: () => void
}

const TONE_OPTIONS: Array<{ value: PrivateNoteTone; label: string; className: string }> = [
  { value: 'neutral', label: 'เรียบ', className: 'bg-card' },
  { value: 'warm', label: 'อบอุ่น', className: 'bg-warning-muted' },
  { value: 'indigo', label: 'คราม', className: 'bg-accent' },
  { value: 'green', label: 'เขียว', className: 'bg-income-muted' },
]

export function PrivateNoteDialog({
  open,
  onOpenChange,
  editingNote,
  editingSecretContent,
  hasExistingVault,
  isVaultUnlocked,
  onRequestUnlock,
}: IPrivateNoteDialog) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const confirm = useConfirm()
  const { form, selectedKind, isSecretFormLocked, onSubmit } = usePrivateNoteForm({
    open,
    editingNote,
    editingSecretContent,
    hasExistingVault,
    isVaultUnlocked,
    onSuccess: () => {
      onOpenChange(false)
      toast.success(editingNote ? 'แก้ไขโน้ตเรียบร้อยแล้ว' : 'บันทึกโน้ตเรียบร้อยแล้ว')
    },
  })

  const {
    register,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = form

  const onRequestClose = async () => {
    if (!isDirty) {
      onOpenChange(false)
      return
    }

    const isConfirmed = await confirm({
      title: 'ทิ้งโน้ตที่กำลังเขียน?',
      description: 'ข้อมูลที่ยังไม่ได้บันทึกจะหายไป',
      confirmLabel: 'ทิ้งข้อมูล',
      tone: 'warning',
    })
    if (isConfirmed) onOpenChange(false)
  }

  const onDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }
    void onRequestClose()
  }

  const onUnlockClick = () => {
    onOpenChange(false)
    onRequestUnlock()
  }

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingNote ? 'แก้ไขโน้ต' : 'เขียนโน้ตใหม่'}</DialogTitle>
          <DialogDescription>โน้ตนี้เป็นข้อมูลส่วนตัวของบัญชีคุณ ไม่แสดงให้สมาชิกคนอื่นเห็น</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-4">
            <Controller
              control={control}
              name="kind"
              render={({ field }) => (
                <Tabs value={field.value} onValueChange={field.onChange}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="note" disabled={editingNote?.kind === 'secret'}>
                      <NotebookPen />
                      โน้ตทั่วไป
                    </TabsTrigger>
                    <TabsTrigger value="secret" disabled={editingNote?.kind === 'note'}>
                      <LockKeyhole />
                      ข้อมูลลับ
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              )}
            />

            {isSecretFormLocked ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-warning/35 bg-warning-muted/45 p-6 text-center">
                <LockKeyhole className="size-7 text-warning" />
                <div>
                  <p className="font-semibold">คลังข้อมูลลับยังล็อกอยู่</p>
                  <p className="mt-1 text-sm text-muted-foreground">ปลดล็อกก่อนเพิ่มหรือแก้ไขรหัสผ่านและข้อมูลสำคัญ</p>
                </div>
                <Button type="button" variant="outline" onClick={onUnlockClick}>
                  ปลดล็อกคลัง
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="private-note-title">
                    {selectedKind === 'secret' ? 'ชื่อบริการหรือหัวข้อ' : 'หัวข้อ'}
                  </Label>
                  <Input
                    id="private-note-title"
                    placeholder={selectedKind === 'secret' ? 'เช่น บัญชีโฮสติ้ง' : 'เช่น ไอเดียประชุมวันจันทร์'}
                    {...register('title')}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
                </div>

                {selectedKind === 'secret' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="private-note-username">ชื่อผู้ใช้ / อีเมล</Label>
                      <Input id="private-note-username" autoComplete="off" {...register('username')} />
                      {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="private-note-password">รหัสผ่าน / คีย์</Label>
                      <div className="relative">
                        <Input
                          id="private-note-password"
                          type={isPasswordVisible ? 'text' : 'password'}
                          autoComplete="new-password"
                          className="pr-10"
                          {...register('password')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="absolute top-1/2 right-1 -translate-y-1/2"
                          onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                          aria-label={isPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                        >
                          {isPasswordVisible ? <EyeOff /> : <Eye />}
                        </Button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5 sm:col-span-2">
                      <Label htmlFor="private-note-website">เว็บไซต์</Label>
                      <Input id="private-note-website" placeholder="https://example.com" {...register('website')} />
                      {errors.website && <p className="text-sm text-destructive">{errors.website.message}</p>}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="private-note-content">
                    {selectedKind === 'secret' ? 'รายละเอียดเพิ่มเติม' : 'รายละเอียด'}
                  </Label>
                  <Textarea
                    id="private-note-content"
                    rows={selectedKind === 'secret' ? 3 : 7}
                    placeholder={selectedKind === 'secret' ? 'คำถามกู้คืน, รหัสสำรอง หรือข้อมูลที่เกี่ยวข้อง' : 'พิมพ์สิ่งที่อยากจำไว้...'}
                    {...register('content')}
                  />
                  {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
                </div>

                {selectedKind === 'note' && (
                  <Controller
                    control={control}
                    name="tone"
                    render={({ field }) => (
                      <fieldset className="flex flex-col gap-2">
                        <legend className="text-sm font-medium">สีโน้ต</legend>
                        <div className="grid grid-cols-4 gap-2">
                          {TONE_OPTIONS.map((toneOption) => (
                            <button
                              key={toneOption.value}
                              type="button"
                              onClick={() => field.onChange(toneOption.value)}
                              aria-pressed={field.value === toneOption.value}
                              className={cn(
                                'flex min-h-11 items-center justify-center gap-2 rounded-xl border px-2 text-xs font-medium transition-colors',
                                toneOption.className,
                                field.value === toneOption.value ? 'border-primary ring-1 ring-primary/30' : 'border-border',
                              )}
                            >
                              <span className="size-2.5 rounded-full bg-current opacity-45" />
                              {toneOption.label}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}
                  />
                )}

                {selectedKind === 'secret' && !hasExistingVault && (
                  <div className="flex flex-col gap-4 rounded-xl border border-warning/30 bg-warning-muted/40 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 size-5 shrink-0 text-warning" />
                      <div>
                        <p className="text-sm font-semibold">ตั้งรหัสหลักสำหรับคลังข้อมูลลับ</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          ต้องใช้รหัสนี้เมื่อเปิดข้อมูลลับครั้งถัดไป หากลืมจะไม่สามารถกู้ข้อมูลได้
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="private-note-master-password">รหัสหลัก</Label>
                        <div className="relative">
                          <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="private-note-master-password"
                            type="password"
                            autoComplete="new-password"
                            className="pl-9"
                            {...register('masterPassword')}
                          />
                        </div>
                        {errors.masterPassword && (
                          <p className="text-sm text-destructive">{errors.masterPassword.message}</p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="private-note-confirm-master-password">ยืนยันรหัสหลัก</Label>
                        <Input
                          id="private-note-confirm-master-password"
                          type="password"
                          autoComplete="new-password"
                          {...register('confirmMasterPassword')}
                        />
                        {errors.confirmMasterPassword && (
                          <p className="text-sm text-destructive">{errors.confirmMasterPassword.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}
              </>
            )}
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onRequestClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isSubmitting || isSecretFormLocked}>
              {isSubmitting ? 'กำลังเข้ารหัส...' : editingNote ? 'บันทึกการแก้ไข' : 'บันทึกโน้ต'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
