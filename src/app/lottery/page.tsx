import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { LotteryPage } from '@/features/lottery/ui/LotteryPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'ตรวจหวย | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <LotteryPage />
      </AppShell>
    </AuthGuard>
  )
}
