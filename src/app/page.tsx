import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/ui/DashboardPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'ภาพรวม | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <DashboardPage />
      </AppShell>
    </AuthGuard>
  )
}
