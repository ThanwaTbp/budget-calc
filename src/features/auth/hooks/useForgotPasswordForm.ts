'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { requestPasswordRecovery, toThaiAuthErrorMessage } from '@/features/auth/services/authService'

const forgotPasswordFormSchema = z.object({
  email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
})

export type IForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

// กันผู้ใช้กดส่งลิงก์รีเซ็ตรหัสถี่เกินไป (ป้องกันสแปม) ต้องรอครบ 60 วินาทีก่อนส่งซ้ำได้
const RESEND_COOLDOWN_SECONDS = 60

// รวม logic ของฟอร์มลืมรหัสผ่าน: ขอลิงก์รีเซ็ต + นับถอยหลังก่อนอนุญาตให้ส่งซ้ำ
export function useForgotPasswordForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  const form = useForm<IForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    if (secondsRemaining <= 0) return

    const timerId = setInterval(() => {
      setSecondsRemaining((seconds) => Math.max(0, seconds - 1))
    }, 1000)

    return () => clearInterval(timerId)
  }, [secondsRemaining])

  const onRequestRecovery = async (email: string) => {
    setIsSubmitting(true)
    try {
      await requestPasswordRecovery({ email, url: `${window.location.origin}/reset-password` })
      setIsEmailSent(true)
      setSecondsRemaining(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      form.setError('root', { message: toThaiAuthErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit = form.handleSubmit((values) => onRequestRecovery(values.email))

  const onResend = () => {
    if (secondsRemaining > 0) return
    onRequestRecovery(form.getValues('email'))
  }

  return { form, onSubmit, onResend, isSubmitting, isEmailSent, secondsRemaining }
}
