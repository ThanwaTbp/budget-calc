'use client'

import { MailCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAppwriteConfigured } from '@/lib/appwrite'
import { AuthCard } from '@/features/auth/ui/AuthCard'
import { AppwriteSetupNotice } from '@/features/auth/ui/AppwriteSetupNotice'
import { useForgotPasswordForm } from '@/features/auth/hooks/useForgotPasswordForm'

export function ForgotPasswordForm() {
  const { form, onSubmit, onResend, isSubmitting, isEmailSent, secondsRemaining } = useForgotPasswordForm()

  const {
    register,
    formState: { errors },
  } = form

  return (
    <AuthCard
      title="ลืมรหัสผ่าน"
      description="กรอกอีเมลที่ใช้สมัคร เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้"
      footerText="นึกรหัสผ่านออกแล้ว?"
      footerLinkLabel="เข้าสู่ระบบ"
      footerLinkHref="/login"
    >
      {!isAppwriteConfigured ? (
        <AppwriteSetupNotice />
      ) : isEmailSent ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-income-muted text-income">
            <MailCheck className="size-5.5" />
          </span>
          <p className="text-sm text-foreground">ส่งลิงก์ไปที่อีเมลแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ</p>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full"
            disabled={secondsRemaining > 0}
            onClick={onResend}
          >
            {secondsRemaining > 0 ? `ส่งอีกครั้งใน ${secondsRemaining} วินาที` : 'ส่งลิงก์อีกครั้ง'}
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            ส่งลิงก์รีเซ็ตรหัสผ่าน
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
