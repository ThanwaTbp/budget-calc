// pure function กรองพยากรณ์รายชั่วโมง — เอาเฉพาะช่วงที่ยังไม่ผ่านไปนับจากเวลาปัจจุบัน แล้วตัดให้เหลือ hoursAhead ชั่วโมงแรก
import type { IHourlyWeather } from '@/types/weather'

const DEFAULT_HOURS_AHEAD = 24

export function filterUpcomingHours(
  hourly: IHourlyWeather[],
  now: Date,
  hoursAhead: number = DEFAULT_HOURS_AHEAD,
): IHourlyWeather[] {
  const upcomingHours = hourly.filter((hourlyItem) => new Date(hourlyItem.time).getTime() >= now.getTime())
  return upcomingHours.slice(0, hoursAhead)
}
