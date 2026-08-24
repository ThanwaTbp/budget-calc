'use client'

import { useState } from 'react'
import { ChevronDown, Droplets } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WeatherIcon } from '@/features/weather/ui/WeatherIcon'
import { getDayLabel } from '@/features/weather/utils/dayLabel'
import { getWeatherAlertLevel, getWeatherDescription, getWeatherIconName } from '@/features/weather/utils/weatherCode'
import { cn } from '@/lib/utils'
import type { IDailyWeather } from '@/types/weather'

const DEFAULT_VISIBLE_DAY_COUNT = 7

interface IDailyForecastList {
  daily: IDailyWeather[]
}

// พยากรณ์รายวัน 7 วันแรก มีปุ่มขยายเป็นครบทุกวันที่มี (สูงสุด 16 วัน ตามที่ route handler ขอมา)
export function DailyForecastList({ daily }: IDailyForecastList) {
  const [isExpanded, setIsExpanded] = useState(false)

  const visibleDaily = isExpanded ? daily : daily.slice(0, DEFAULT_VISIBLE_DAY_COUNT)
  const hasMoreDays = !isExpanded && daily.length > DEFAULT_VISIBLE_DAY_COUNT

  const onShowMoreDays = () => setIsExpanded(true)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="font-semibold tracking-tight">พยากรณ์รายวัน</p>

      <div className="flex flex-col gap-2">
        {visibleDaily.map((dailyItem) => (
          <DailyForecastRow key={dailyItem.date} daily={dailyItem} />
        ))}
      </div>

      {hasMoreDays && (
        <Button variant="outline" size="sm" className="self-center" onClick={onShowMoreDays}>
          <ChevronDown />
          แสดง 16 วันข้างหน้า
        </Button>
      )}
    </div>
  )
}

interface IDailyForecastRow {
  daily: IDailyWeather
}

function DailyForecastRow({ daily }: IDailyForecastRow) {
  const alertLevel = getWeatherAlertLevel(daily.weatherCode, daily.precipitationProbability)
  const dayLabel = getDayLabel(daily.date)
  const description = getWeatherDescription(daily.weatherCode)
  const iconName = getWeatherIconName(daily.weatherCode)

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border p-3',
        alertLevel === 'severe' && 'border-expense/40 bg-expense-muted',
        alertLevel === 'caution' && 'border-warning/40 bg-warning-muted',
        alertLevel === 'normal' && 'border-border',
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <WeatherIcon
          name={iconName}
          className={cn(
            'size-6 shrink-0',
            alertLevel === 'severe' ? 'text-expense' : alertLevel === 'caution' ? 'text-warning' : 'text-primary',
          )}
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-medium">{dayLabel}</span>
          <span className="truncate text-xs text-muted-foreground">{description}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <span
          className={cn(
            'tabular flex items-center gap-1 text-xs',
            alertLevel === 'severe' ? 'text-expense' : alertLevel === 'caution' ? 'text-warning' : 'text-muted-foreground',
          )}
        >
          <Droplets className="size-3.5" />
          {Math.round(daily.precipitationProbability)}%
        </span>

        <span className="tabular text-sm">
          <span className="text-muted-foreground">{Math.round(daily.temperatureMin)}°</span>
          {' - '}
          <span className="font-semibold">{Math.round(daily.temperatureMax)}°</span>
        </span>
      </div>
    </div>
  )
}
