import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { PayrollPage } from '@/features/payroll/ui/PayrollPage'

export const metadata: Metadata = {
  title: 'ค่าจ้างพนักงาน | Budget Calculate',
}

export default function Page() {
  return (
    <AppShell>
      <PayrollPage />
    </AppShell>
  )
}
