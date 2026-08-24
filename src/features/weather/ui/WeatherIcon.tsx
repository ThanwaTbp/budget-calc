import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun, type LucideIcon } from 'lucide-react'
import type { WeatherIconName } from '@/features/weather/utils/weatherCode'

const WEATHER_ICON_MAP: Record<WeatherIconName, LucideIcon> = {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  Snowflake,
  CloudLightning,
}

interface IWeatherIcon {
  name: WeatherIconName
  className?: string
}

// map ชื่อไอคอนสภาพอากาศ (จาก getWeatherIconName) เป็น component ไอคอนจริงของ lucide-react
export function WeatherIcon({ name, className }: IWeatherIcon) {
  const Icon = WEATHER_ICON_MAP[name]
  return <Icon className={className} />
}
