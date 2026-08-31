import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'
import { PrivateNotesPage } from '@/features/privateNotes/ui/PrivateNotesPage'

export const metadata: Metadata = {
  title: 'โน้ตส่วนตัว | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <PrivateNotesPage />
      </AppShell>
    </AuthGuard>
  )
}
