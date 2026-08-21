import type { Metadata } from 'next'
import { LoginForm } from '@/features/auth/ui/LoginForm'

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Budget Calculate',
}

export default function LoginPage() {
  return <LoginForm />
}
