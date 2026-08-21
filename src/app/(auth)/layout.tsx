import type { ReactNode } from 'react'
import { GuestGuard } from '@/features/auth/ui/GuestGuard'

// layout กลางจอสำหรับหน้า auth ทั้งหมด (login/register/forgot-password/reset-password) — ไม่มี AppShell/sidebar
export default function AuthRouteLayout({ children }: { children: ReactNode }) {
  return (
    <GuestGuard>
      <div className="flex min-h-svh items-center justify-center bg-background px-4 py-10">{children}</div>
    </GuestGuard>
  )
}
