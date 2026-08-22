import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { PlannerPage } from '@/features/planner/ui/PlannerPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'วางแผนงาน | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <PlannerPage />
      </AppShell>
    </AuthGuard>
  )
}
