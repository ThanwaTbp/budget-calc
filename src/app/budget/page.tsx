import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { BudgetPage } from '@/features/budget/ui/BudgetPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'งบประมาณ | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <BudgetPage />
      </AppShell>
    </AuthGuard>
  )
}
