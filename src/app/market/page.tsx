import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { MarketPage } from '@/features/market/ui/MarketPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'ราคาตลาด | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <MarketPage />
      </AppShell>
    </AuthGuard>
  )
}
