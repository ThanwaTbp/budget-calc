import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { StatusPage } from '@/features/status/ui/StatusPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'สถานะระบบ | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <StatusPage />
      </AppShell>
    </AuthGuard>
  )
}
