'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAppwriteConfigured } from '@/lib/appwrite'
import { AuthCard } from '@/features/auth/ui/AuthCard'
import { AppwriteSetupNotice } from '@/features/auth/ui/AppwriteSetupNotice'
import { useResetPasswordForm } from '@/features/auth/hooks/useResetPasswordForm'

export function ResetPasswordForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const { form, onSubmit, isSubmitting, isLinkValid } = useResetPasswordForm()

  const {
    register,
    formState: { errors },
  } = form

  const onTogglePasswordVisibility = () => {
    setIsPasswordVisible((visible) => !visible)
  }

  const onToggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible((visible) => !visible)
  }

  return (
    <AuthCard
      title="ตั้งรหัสผ่านใหม่"
      description="กรอกรหัสผ่านใหม่ที่ต้องการใช้เข้าสู่ระบบ"
      footerText="นึกรหัสผ่านออกแล้ว?"
      footerLinkLabel="เข้าสู่ระบบ"
      footerLinkHref="/login"
    >
      {!isAppwriteConfigured ? (
        <AppwriteSetupNotice />
      ) : !isLinkValid ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-sm text-destructive">ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว</p>
          <p className="text-sm text-muted-foreground">
            กรุณา
            <Link href="/forgot-password" className="mx-1 font-medium text-primary hover:underline">
              ขอลิงก์รีเซ็ตรหัสผ่านใหม่
            </Link>
            อีกครั้ง
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">รหัสผ่านใหม่</Label>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={onTogglePasswordVisibility}
                aria-label={isPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {isPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={isConfirmPasswordVisible ? 'text' : 'password'}
                autoComplete="new-password"
                className="pr-10"
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={onToggleConfirmPasswordVisibility}
                aria-label={isConfirmPasswordVisible ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {isConfirmPasswordVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            ตั้งรหัสผ่านใหม่
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
