import { AlertTriangle, Droplets, Thermometer, Wind } from 'lucide-react'
import { WeatherIcon } from '@/features/weather/ui/WeatherIcon'
import { getWeatherDescription, getWeatherIconName } from '@/features/weather/utils/weatherCode'
import { cn } from '@/lib/utils'
import type { ICurrentWeather, WeatherAlertLevel } from '@/types/weather'

interface ICurrentWeatherCard {
  current: ICurrentWeather
  locationLabel: string
  alertLevel: WeatherAlertLevel
}

// การ์ดใหญ่แสดงสภาพอากาศปัจจุบันของสถานที่ที่เลือกอยู่ พร้อมแถบเตือนเมื่อระดับความเสี่ยงไม่ปกติ
export function CurrentWeatherCard({ current, locationLabel, alertLevel }: ICurrentWeatherCard) {
  const description = getWeatherDescription(current.weatherCode)
  const iconName = getWeatherIconName(current.weatherCode)

  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div className="flex items-center gap-4">
          <WeatherIcon name={iconName} className="size-16 text-primary sm:size-20" />
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-muted-foreground">{locationLabel}</p>
            <p className="tabular text-5xl font-bold">{Math.round(current.temperature)}°</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      {alertLevel !== 'normal' && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg border p-3 text-sm font-medium',
            alertLevel === 'severe'
              ? 'border-expense/40 bg-expense-muted text-expense'
              : 'border-warning/40 bg-warning-muted text-warning',
          )}
        >
          <AlertTriangle className="size-4 shrink-0" />
          {alertLevel === 'severe'
            ? 'สภาพอากาศรุนแรง โปรดระวังพายุฝนฟ้าคะนองหรือฝนตกหนัก'
            : 'มีโอกาสฝนตกค่อนข้างสูง เตรียมร่มหรืออุปกรณ์กันฝนไว้'}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-4">
        <WeatherStat icon={Thermometer} label="รู้สึกเหมือน" value={`${Math.round(current.apparentTemperature)}°`} />
        <WeatherStat icon={Droplets} label="ความชื้น" value={`${Math.round(current.humidity)}%`} />
        <WeatherStat icon={Wind} label="ลม" value={`${Math.round(current.windSpeed)} กม./ชม.`} />
        <WeatherStat icon={Droplets} label="ฝน" value={`${current.precipitation.toFixed(1)} มม.`} />
      </div>
    </div>
  )
}

interface IWeatherStat {
  icon: typeof Thermometer
  label: string
  value: string
}

function WeatherStat({ icon: Icon, label, value }: IWeatherStat) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <Icon className="size-4 text-muted-foreground" />
      <p className="tabular text-base font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
