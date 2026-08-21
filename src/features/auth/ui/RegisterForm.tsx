'use client'

import { useState } from 'react'
import { useWatch } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAppwriteConfigured } from '@/lib/appwrite'
import { AuthCard } from '@/features/auth/ui/AuthCard'
import { AppwriteSetupNotice } from '@/features/auth/ui/AppwriteSetupNotice'
import { useRegisterForm } from '@/features/auth/hooks/useRegisterForm'
import {
  PASSWORD_STRENGTH_BAR_CLASS,
  PASSWORD_STRENGTH_FILLED_BAR_COUNT,
  PASSWORD_STRENGTH_LABEL,
  PASSWORD_STRENGTH_TEXT_CLASS,
  getPasswordStrength,
} from '@/features/auth/utils/passwordStrength'

export function RegisterForm() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const { form, onSubmit, isSubmitting } = useRegisterForm()

  const {
    register,
    control,
    formState: { errors },
  } = form

  // ใช้ useWatch แทน form.watch() เพื่อไม่ต้องอ่านค่าฟอร์มแบบ imperative
  const passwordValue = useWatch({ control, name: 'password' })
  const passwordStrength = getPasswordStrength(passwordValue ?? '')

  const onTogglePasswordVisibility = () => {
    setIsPasswordVisible((visible) => !visible)
  }

  const onToggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible((visible) => !visible)
  }

  return (
    <AuthCard
      title="สมัครสมาชิก"
      description="สร้างบัญชีเพื่อเริ่มบันทึกรายรับรายจ่ายและค่าจ้างพนักงาน"
      footerText="มีบัญชีอยู่แล้ว?"
      footerLinkLabel="เข้าสู่ระบบ"
      footerLinkHref="/login"
    >
      {!isAppwriteConfigured ? (
        <AppwriteSetupNotice />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">ชื่อ</Label>
            <Input id="name" type="text" autoComplete="name" placeholder="ชื่อของคุณ" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

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
            <Label htmlFor="password">รหัสผ่าน</Label>
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

            {passwordValue ? (
              <div className="flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3].map((barIndex) => (
                    <span
                      key={barIndex}
                      className={cn(
                        'h-1.5 flex-1 rounded-full bg-muted',
                        barIndex <= PASSWORD_STRENGTH_FILLED_BAR_COUNT[passwordStrength] &&
                          PASSWORD_STRENGTH_BAR_CLASS[passwordStrength],
                      )}
                    />
                  ))}
                </div>
                <span className={cn('text-xs font-medium', PASSWORD_STRENGTH_TEXT_CLASS[passwordStrength])}>
                  {PASSWORD_STRENGTH_LABEL[passwordStrength]}
                </span>
              </div>
            ) : null}

            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</Label>
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
            สมัครสมาชิก
          </Button>
        </form>
      )}
    </AuthCard>
  )
}
