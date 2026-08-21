import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { PayrollPage } from '@/features/payroll/ui/PayrollPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'ค่าจ้างพนักงาน | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <PayrollPage />
      </AppShell>
    </AuthGuard>
  )
}
