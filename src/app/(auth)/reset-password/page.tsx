import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/features/auth/ui/ResetPasswordForm'

export const metadata: Metadata = {
  title: 'ตั้งรหัสผ่านใหม่ | Budget Calculate',
}

export default function ResetPasswordPage() {
  return (
    // ResetPasswordForm ใช้ useSearchParams จึงต้องครอบด้วย Suspense
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
