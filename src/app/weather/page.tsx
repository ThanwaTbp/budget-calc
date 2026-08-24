import type { Metadata } from 'next'
import { AppShell } from '@/components/layout/AppShell'
import { WeatherPage } from '@/features/weather/ui/WeatherPage'
import { AuthGuard } from '@/features/auth/ui/AuthGuard'

export const metadata: Metadata = {
  title: 'สภาพอากาศ | Budget Calculate',
}

export default function Page() {
  return (
    <AuthGuard>
      <AppShell>
        <WeatherPage />
      </AppShell>
    </AuthGuard>
  )
}
