'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { toThaiAuthErrorMessage } from '@/features/auth/services/authService'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

const profileNameFormSchema = z.object({
  name: z.string().trim().min(1, 'กรุณากรอกชื่อ').max(128, 'ชื่อต้องไม่เกิน 128 ตัวอักษร'),
})

export type IProfileNameFormValues = z.infer<typeof profileNameFormSchema>

export function useProfileNameForm() {
  const user = useAuthStore((state) => state.user)
  const onUpdateName = useAuthStore((state) => state.onUpdateName)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<IProfileNameFormValues>({
    resolver: zodResolver(profileNameFormSchema),
    defaultValues: { name: user?.name ?? '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onUpdateName(values)
      form.reset({ name: values.name.trim() })
      toast.success('อัปเดตชื่อเรียบร้อยแล้ว')
    } catch (error) {
      form.setError('root', { message: toThaiAuthErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  return { form, onSubmit, isSubmitting }
}
