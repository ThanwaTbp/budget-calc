import { CloudRain } from 'lucide-react'
import { EmptyState } from '@/components/common/EmptyState'
import { WeatherIcon } from '@/features/weather/ui/WeatherIcon'
import { getWeatherIconName } from '@/features/weather/utils/weatherCode'
import type { IHourlyWeather } from '@/types/weather'

interface IHourlyStrip {
  hourly: IHourlyWeather[]
}

const hourLabelFormatter = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })

// พยากรณ์รายชั่วโมง 24 ชั่วโมงข้างหน้า เลื่อนดูแนวนอนได้
export function HourlyStrip({ hourly }: IHourlyStrip) {
  if (hourly.length === 0) {
    return (
      <EmptyState icon={CloudRain} title="ไม่มีข้อมูลรายชั่วโมง" description="ไม่พบพยากรณ์รายชั่วโมงในช่วงเวลานี้" />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-semibold tracking-tight">พยากรณ์รายชั่วโมง</p>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {hourly.map((hourlyItem) => (
          <div
            key={hourlyItem.time}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-lg border border-border bg-card p-3 text-center"
          >
            <span className="tabular text-xs text-muted-foreground">{hourLabelFormatter.format(new Date(hourlyItem.time))}</span>
            <WeatherIcon name={getWeatherIconName(hourlyItem.weatherCode)} className="size-6 text-primary" />
            <span className="tabular text-sm font-semibold">{Math.round(hourlyItem.temperature)}°</span>
            <span className="tabular text-xs text-muted-foreground">{Math.round(hourlyItem.precipitationProbability)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
