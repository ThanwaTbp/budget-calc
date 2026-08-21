'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { confirmPasswordRecovery, toThaiAuthErrorMessage } from '@/features/auth/services/authService'

const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export type IResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

// รวม logic ของฟอร์มตั้งรหัสผ่านใหม่: อ่าน userId/secret จากลิงก์ แล้วเรียก Appwrite เพื่อยืนยันการตั้งรหัสใหม่
export function useResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const userId = searchParams.get('userId')
  const secret = searchParams.get('secret')
  const isLinkValid = Boolean(userId && secret)

  const form = useForm<IResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    if (!userId || !secret) return

    setIsSubmitting(true)
    try {
      await confirmPasswordRecovery({ userId, secret, password: values.password })
      toast.success('ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว')
      router.push('/login')
    } catch (error) {
      form.setError('root', { message: toThaiAuthErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  return { form, onSubmit, isSubmitting, isLinkValid }
}
