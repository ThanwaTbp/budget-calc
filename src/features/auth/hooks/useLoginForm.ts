'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { toThaiAuthErrorMessage } from '@/features/auth/services/authService'

const loginFormSchema = z.object({
  email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
})

export type ILoginFormValues = z.infer<typeof loginFormSchema>

// รวม logic ของฟอร์มล็อกอิน: validate ด้วย zod, เรียก store แล้วพาไปหน้าแรกเมื่อสำเร็จ
export function useLoginForm() {
  const router = useRouter()
  const onLogin = useAuthStore((state) => state.onLogin)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<ILoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onLogin(values)
      toast.success('เข้าสู่ระบบสำเร็จ')
      router.replace('/transactions')
    } catch (error) {
      form.setError('root', { message: toThaiAuthErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  return { form, onSubmit, isSubmitting }
}
