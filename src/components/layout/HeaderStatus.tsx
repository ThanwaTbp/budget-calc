'use client'

import Link from 'next/link'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentTime } from '@/hooks/useCurrentTime'
import { WeatherIcon } from '@/features/weather/ui/WeatherIcon'
import { useWeatherForecast } from '@/features/weather/hooks/useWeatherForecast'
import { useWeatherLocationStore } from '@/features/weather/store/useWeatherLocationStore'
import { getWeatherDescription, getWeatherIconName } from '@/features/weather/utils/weatherCode'

const dateFormatter = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

// แถบสถานะฝั่งซ้ายของ header: วันที่ นาฬิกาเดินจริง และสภาพอากาศของสถานที่ที่เลือกไว้
// พื้นที่ตรงนี้เดิมว่างเปล่า จึงใช้แสดงข้อมูลที่ผู้ใช้เหลือบดูได้ตลอดโดยไม่ต้องเปิดหน้าไหน
export function HeaderStatus() {
  const currentTime = useCurrentTime()
  const location = useWeatherLocationStore((state) => state.location)
  const { forecast, isLoading } = useWeatherForecast()

  const currentWeather = forecast?.current ?? null

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
      {currentTime ? (
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden h-9 min-w-0 items-center gap-2 rounded-xl border border-border bg-card px-3 text-muted-foreground shadow-sm md:flex">
            <CalendarDays className="size-4 shrink-0 text-primary" />
            <span className="truncate">{dateFormatter.format(currentTime)}</span>
          </span>
          <span className="tabular flex h-9 items-center gap-2 rounded-xl border border-primary/15 bg-accent px-3 font-semibold text-accent-foreground">
            <Clock3 className="size-4" />
            {timeFormatter.format(currentTime)}
          </span>
        </div>
      ) : (
        // กันหน้ากระตุกตอนนาฬิกายังไม่เริ่มเดิน จองพื้นที่ไว้ให้เท่าของจริง
        <Skeleton className="h-5 w-24" />
      )}

      {currentWeather ? (
        <Link
          href="/weather"
          title={`${getWeatherDescription(currentWeather.weatherCode)} ที่${location.name}`}
          className="group hidden h-9 min-w-0 items-center gap-2 rounded-xl border border-warning/20 bg-warning-muted px-3 text-warning transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-warning/40 md:flex"
        >
          <WeatherIcon name={getWeatherIconName(currentWeather.weatherCode)} className="size-5 shrink-0" />
          <span className="hidden min-w-0 items-center gap-1.5 lg:flex">
            <MapPin className="size-3.5 shrink-0" />
            <span className="max-w-40 truncate">{location.name}</span>
          </span>
          <span className="tabular font-semibold">{Math.round(currentWeather.temperature)}°</span>
        </Link>
      ) : null}

      {/* กำลังโหลดอากาศครั้งแรกให้จองพื้นที่ไว้ ไม่ให้ปุ่มฝั่งขวาขยับตอนข้อมูลมาถึง */}
      {!currentWeather && isLoading ? <Skeleton className="hidden h-9 w-28 rounded-xl md:block lg:w-44" /> : null}
    </div>
  )
}
