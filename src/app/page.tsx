import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/ui/DashboardPage'

export const metadata: Metadata = {
  title: 'ภาพรวม | Budget Calculate',
}

export default function Page() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  )
}
