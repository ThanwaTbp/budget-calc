import type { Metadata } from 'next'
import { ForgotPasswordForm } from '@/features/auth/ui/ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'ลืมรหัสผ่าน | Budget Calculate',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />
}
