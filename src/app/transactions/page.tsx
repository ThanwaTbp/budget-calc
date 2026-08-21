import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { TransactionPage } from '@/features/transactions/ui/TransactionPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'รายรับ-รายจ่าย | Budget Calculate',
}

export default function TransactionsRoute() {
  return (
    <AuthGuard>
      <AppShell>
        <TransactionPage />
      </AppShell>
    </AuthGuard>
  )
}
