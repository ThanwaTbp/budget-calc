import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { SettingsPage } from '@/features/settings/ui/SettingsPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'ตั้งค่า | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <SettingsPage />
      </AppShell>
    </AuthGuard>
  )
}
