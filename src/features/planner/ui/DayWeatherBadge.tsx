import { WeatherIcon } from '@/features/weather/ui/WeatherIcon'
import { getWeatherIconName } from '@/features/weather/utils/weatherCode'
import type { ITaskWeather } from '@/features/weather/hooks/useTaskWeather'
import type { WeatherAlertLevel } from '@/types/weather'
import { cn } from '@/lib/utils'

interface IDayWeatherBadge {
  weather: ITaskWeather | null
  variant?: 'compact' | 'detailed'
}

// สีพื้น/ตัวอักษรตามระดับเตือน ใช้ token เดียวกับหน้าสภาพอากาศ (ดู docs/SPEC.md)
const ALERT_TONE_CLASS: Record<WeatherAlertLevel, string> = {
  severe: 'bg-expense-muted text-expense',
  caution: 'bg-warning-muted text-warning',
  normal: 'bg-muted text-muted-foreground',
}

// ป้ายสภาพอากาศของหนึ่งวัน ใช้ซ้ำได้ทั้งหัวกลุ่มมุมมองรายเดือน (compact) และหัววันมุมมองรายวัน (detailed)
export function DayWeatherBadge({ weather, variant = 'compact' }: IDayWeatherBadge) {
  if (!weather) return null

  const iconName = getWeatherIconName(weather.weatherCode)
  const toneClass = ALERT_TONE_CLASS[weather.alertLevel]

  if (variant === 'detailed') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm', toneClass)}>
        <WeatherIcon name={iconName} className="size-4 shrink-0" />
        <span>{weather.description}</span>
        <span className="tabular">
          {Math.round(weather.temperatureMin)}–{Math.round(weather.temperatureMax)}°
        </span>
        <span className="tabular">โอกาสฝน {Math.round(weather.precipitationProbability)}%</span>
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs', toneClass)}>
      <WeatherIcon name={iconName} className="size-3.5 shrink-0" />
      <span className="tabular">{Math.round(weather.temperatureMax)}°</span>
      <span className="tabular">ฝน {Math.round(weather.precipitationProbability)}%</span>
    </span>
  )
}
