import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'
import { RecurringPage } from '@/features/recurring/ui/RecurringPage'

export const metadata: Metadata = {
  title: 'รายการประจำ | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <RecurringPage />
      </AppShell>
    </AuthGuard>
  )
}
