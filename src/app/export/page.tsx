import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { ExportPage } from '@/features/export/ui/ExportPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'ส่งออกข้อมูล | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <ExportPage />
      </AppShell>
    </AuthGuard>
  )
}
