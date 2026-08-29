'use client'

import { useState } from 'react'
import { Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfilePasswordForm, type IProfilePasswordFormValues } from '@/features/auth/hooks/useProfilePasswordForm'
import type { UseFormRegister } from 'react-hook-form'

interface IPasswordField {
  id: string
  label: string
  fieldName: keyof IProfilePasswordFormValues
  autoComplete: 'current-password' | 'new-password'
  register: UseFormRegister<IProfilePasswordFormValues>
  errorMessage?: string
}

function PasswordField({ id, label, fieldName, autoComplete, register, errorMessage }: IPasswordField) {
  const [isVisible, setIsVisible] = useState(false)

  const onToggleVisibility = () => setIsVisible((visible) => !visible)

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className="pr-10"
          {...register(fieldName)}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          aria-label={isVisible ? `ซ่อน${label}` : `แสดง${label}`}
        >
          {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}
    </div>
  )
}

export function ProfilePasswordForm() {
  const { form, onSubmit, isSubmitting } = useProfilePasswordForm()
  const {
    register,
    formState: { errors },
  } = form

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <PasswordField
        id="current-password"
        label="รหัสผ่านปัจจุบัน"
        fieldName="currentPassword"
        autoComplete="current-password"
        register={register}
        errorMessage={errors.currentPassword?.message}
      />
      <PasswordField
        id="new-password"
        label="รหัสผ่านใหม่"
        fieldName="newPassword"
        autoComplete="new-password"
        register={register}
        errorMessage={errors.newPassword?.message}
      />
      <PasswordField
        id="confirm-password"
        label="ยืนยันรหัสผ่านใหม่"
        fieldName="confirmPassword"
        autoComplete="new-password"
        register={register}
        errorMessage={errors.confirmPassword?.message}
      />

      <p className="text-sm text-muted-foreground">รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร</p>
      {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

      <Button type="submit" className="self-start" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
        เปลี่ยนรหัสผ่าน
      </Button>
    </form>
  )
}
