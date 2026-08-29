import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'
import { ProfilePage } from '@/features/auth/ui/ProfilePage'

export const metadata: Metadata = {
  title: 'โปรไฟล์ | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <ProfilePage />
      </AppShell>
    </AuthGuard>
  )
}
