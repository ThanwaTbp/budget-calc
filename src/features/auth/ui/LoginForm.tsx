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
import { useLoginForm } from '@/features/auth/hooks/useLoginForm'

export function LoginForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const { form, onSubmit, isSubmitting } = useLoginForm()

  const {
    register,
    formState: { errors },
  } = form

  const onTogglePasswordVisibility = () => {
    setIsPasswordVisible((visible) => !visible)
  }

  return (
    <AuthCard
      title="เข้าสู่ระบบ"
      description="เข้าสู่ระบบเพื่อจัดการรายรับรายจ่ายและค่าจ้างพนักงานของคุณ"
      footerText="ยังไม่มีบัญชี?"
      footerLinkLabel="สมัครสมาชิก"
      footerLinkHref="/register"
    >
      {!isAppwriteConfigured ? (
        <AppwriteSetupNotice />
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

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={isPasswordVisible ? 'text' : 'password'}
                autoComplete="current-password"
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

          {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            เข้าสู่ระบบ
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
