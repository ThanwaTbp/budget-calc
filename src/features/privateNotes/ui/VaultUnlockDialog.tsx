'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound, LockKeyhole } from 'lucide-react'
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
import { usePrivateNoteStore } from '@/features/privateNotes/store/usePrivateNoteStore'

interface IVaultUnlockDialog {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUnlocked?: () => void
}

export function VaultUnlockDialog({ open, onOpenChange, onUnlocked }: IVaultUnlockDialog) {
  const [masterPassword, setMasterPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const onUnlockVault = usePrivateNoteStore((state) => state.onUnlockVault)

  const onDialogOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }
    setMasterPassword('')
    setErrorMessage(null)
    onOpenChange(false)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!masterPassword) {
      setErrorMessage('กรุณากรอกรหัสหลัก')
      return
    }

    setIsUnlocking(true)
    const isUnlocked = await onUnlockVault(masterPassword)
    setIsUnlocking(false)

    if (!isUnlocked) {
      setErrorMessage('รหัสหลักไม่ถูกต้อง หรือข้อมูลลับเสียหาย')
      return
    }

    setMasterPassword('')
    onOpenChange(false)
    toast.success('ปลดล็อกคลังข้อมูลลับแล้ว')
    onUnlocked?.()
  }

  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <LockKeyhole className="size-5" />
          </span>
          <DialogTitle>ปลดล็อกข้อมูลลับ</DialogTitle>
          <DialogDescription>รหัสหลักใช้ถอดรหัสเฉพาะในเครื่องนี้ และจะไม่ถูกบันทึกหรือซิงก์ขึ้นคลาวด์</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogBody className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vault-master-password">รหัสหลัก</Label>
              <div className="relative">
                <KeyRound className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="vault-master-password"
                  type="password"
                  autoComplete="current-password"
                  className="pl-9"
                  value={masterPassword}
                  onChange={(event) => {
                    setMasterPassword(event.target.value)
                    setErrorMessage(null)
                  }}
                  autoFocus
                />
              </div>
              {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onDialogOpenChange(false)}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isUnlocking}>
              {isUnlocking ? 'กำลังปลดล็อก...' : 'ปลดล็อก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
