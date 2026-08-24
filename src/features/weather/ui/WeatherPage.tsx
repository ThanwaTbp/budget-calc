'use client'

import { CloudAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useWeatherForecast } from '@/features/weather/hooks/useWeatherForecast'
import { useWeatherLocationStore } from '@/features/weather/store/useWeatherLocationStore'
import { getWeatherAlertLevel } from '@/features/weather/utils/weatherCode'
import { filterUpcomingHours } from '@/features/weather/utils/filterUpcomingHours'
import { LocationSearch } from '@/features/weather/ui/LocationSearch'
import { CurrentWeatherCard } from '@/features/weather/ui/CurrentWeatherCard'
import { HourlyStrip } from '@/features/weather/ui/HourlyStrip'
import { DailyForecastList } from '@/features/weather/ui/DailyForecastList'

export function WeatherPage() {
  const isHydrated = useHydrated()
  const location = useWeatherLocationStore((state) => state.location)
  const { forecast, isLoading, errorMessage, onRetry } = useWeatherForecast()

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const locationLabel = [location.name, location.admin1, location.country].filter(Boolean).join(', ')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="สภาพอากาศ" description="พยากรณ์อากาศปัจจุบันและล่วงหน้า 16 วัน">
        <LocationSearch />
      </PageHeader>

      {isLoading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-56 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      )}

      {!isLoading && !forecast && (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-6 shadow-sm">
          <EmptyState
            icon={CloudAlert}
            title="ดึงข้อมูลพยากรณ์อากาศไม่สำเร็จ"
            description={errorMessage ?? 'ไม่สามารถโหลดพยากรณ์อากาศได้ กรุณาลองใหม่อีกครั้ง'}
          >
            <Button onClick={onRetry}>ลองใหม่</Button>
          </EmptyState>
        </div>
      )}

      {!isLoading && forecast && (
        <>
          {/* ใช้โอกาสฝนของวันนี้ (daily ตัวแรก) ประกอบการประเมินระดับเตือนของสภาพอากาศปัจจุบัน */}
          <CurrentWeatherCard
            current={forecast.current}
            locationLabel={locationLabel}
            alertLevel={getWeatherAlertLevel(forecast.current.weatherCode, forecast.daily[0]?.precipitationProbability ?? 0)}
          />

          <HourlyStrip hourly={filterUpcomingHours(forecast.hourly, new Date())} />

          <DailyForecastList daily={forecast.daily} />
        </>
      )}

      <p className="text-xs text-muted-foreground">ข้อมูลจาก Open-Meteo</p>
    </div>
  )
}
