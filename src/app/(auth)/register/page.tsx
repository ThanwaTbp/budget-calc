import type { Metadata } from 'next'
import { RegisterForm } from '@/features/auth/ui/RegisterForm'

export const metadata: Metadata = {
  title: 'สมัครสมาชิก | Budget Calculate',
}

export default function RegisterPage() {
  return <RegisterForm />
}
