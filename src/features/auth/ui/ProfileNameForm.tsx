'use client'

import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfileNameForm } from '@/features/auth/hooks/useProfileNameForm'

export function ProfileNameForm() {
  const { form, onSubmit, isSubmitting } = useProfileNameForm()
  const {
    register,
    formState: { errors, isDirty },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">ชื่อที่แสดง</Label>
        <Input id="profile-name" autoComplete="name" {...register('name')} />
        <p className="text-sm text-muted-foreground">ชื่อนี้จะแสดงบนเมนูผู้ใช้และส่วนต่าง ๆ ของแอป</p>
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <Button type="submit" className="self-start" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
        บันทึกชื่อ
      </Button>
    </form>
  )
}
