'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { toThaiPasswordUpdateErrorMessage } from '@/features/auth/services/authService'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

const profilePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
    newPassword: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'รหัสผ่านใหม่ไม่ตรงกัน',
    path: ['confirmPassword'],
  })
  .refine((values) => values.currentPassword !== values.newPassword, {
    message: 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านปัจจุบัน',
    path: ['newPassword'],
  })

export type IProfilePasswordFormValues = z.infer<typeof profilePasswordFormSchema>

export function useProfilePasswordForm() {
  const onUpdatePassword = useAuthStore((state) => state.onUpdatePassword)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<IProfilePasswordFormValues>({
    resolver: zodResolver(profilePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onUpdatePassword(values)
      form.reset()
      toast.success('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว')
    } catch (error) {
      form.setError('root', { message: toThaiPasswordUpdateErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  return { form, onSubmit, isSubmitting }
}
