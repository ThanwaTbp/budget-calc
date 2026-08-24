'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { toThaiAuthErrorMessage } from '@/features/auth/services/authService'

const registerFormSchema = z
  .object({
    name: z.string().min(1, 'กรุณากรอกชื่อ').max(128, 'ชื่อต้องไม่เกิน 128 ตัวอักษร'),
    email: z.string().min(1, 'กรุณากรอกอีเมล').email('รูปแบบอีเมลไม่ถูกต้อง'),
    // Appwrite กำหนดความยาวรหัสผ่านขั้นต่ำ 8 ตัวอักษร
    password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
    confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'รหัสผ่านไม่ตรงกัน',
    path: ['confirmPassword'],
  })

export type IRegisterFormValues = z.infer<typeof registerFormSchema>

// รวม logic ของฟอร์มสมัครสมาชิก: validate ด้วย zod, สมัคร+ล็อกอินผ่าน store แล้วพาไปหน้าแรกเมื่อสำเร็จ
export function useRegisterForm() {
  const router = useRouter()
  const onRegister = useAuthStore((state) => state.onRegister)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<IRegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true)
    try {
      await onRegister(values)
      toast.success('สมัครสมาชิกสำเร็จ')
      router.replace('/transactions')
    } catch (error) {
      form.setError('root', { message: toThaiAuthErrorMessage(error) })
    } finally {
      setIsSubmitting(false)
    }
  })

  return { form, onSubmit, isSubmitting }
}
