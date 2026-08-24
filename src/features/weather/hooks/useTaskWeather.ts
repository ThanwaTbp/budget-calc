'use client'

// เชื่อมพยากรณ์อากาศเข้ากับหน้าวางแผนงาน — map วันที่งาน ('yyyy-MM-dd') เป็นสภาพอากาศของวันนั้น
// พยากรณ์มีล่วงหน้าแค่ 16 วัน วันนอกช่วงหรือดึงข้อมูลไม่สำเร็จต้องคืน null เสมอ ห้ามเดา
import { useCallback, useMemo } from 'react'
import { useWeatherForecast } from '@/features/weather/hooks/useWeatherForecast'
import { useWeatherLocationStore } from '@/features/weather/store/useWeatherLocationStore'
import { getWeatherAlertLevel, getWeatherDescription } from '@/features/weather/utils/weatherCode'
import type { IDailyWeather, WeatherAlertLevel } from '@/types/weather'

export interface ITaskWeather {
  date: string
  weatherCode: number
  description: string
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number
  alertLevel: WeatherAlertLevel
}

// แปลงพยากรณ์รายวันดิบเป็นข้อมูลพร้อมแสดงผล (คำอธิบายไทย + ระดับเตือน) — pure function แยกไว้ให้ทดสอบได้
export function buildTaskWeather(daily: IDailyWeather): ITaskWeather {
  return {
    date: daily.date,
    weatherCode: daily.weatherCode,
    description: getWeatherDescription(daily.weatherCode),
    temperatureMax: daily.temperatureMax,
    temperatureMin: daily.temperatureMin,
    precipitationProbability: daily.precipitationProbability,
    alertLevel: getWeatherAlertLevel(daily.weatherCode, daily.precipitationProbability),
  }
}

// สร้าง Map<date, IDailyWeather> ไว้ค้นหาแบบ O(1) แทนการ .find() ทุกครั้งที่ render (งานในเดือนอาจมีหลายสิบวัน)
export function buildDailyWeatherMap(daily: IDailyWeather[]): Map<string, IDailyWeather> {
  return new Map(daily.map((dailyWeather) => [dailyWeather.date, dailyWeather]))
}

interface IUseTaskWeather {
  getWeatherForDate: (date: string) => ITaskWeather | null
  locationName: string
  isLoading: boolean
  hasForecast: boolean
}

export function useTaskWeather(): IUseTaskWeather {
  const { forecast, isLoading } = useWeatherForecast()
  const location = useWeatherLocationStore((state) => state.location)

  const dailyWeatherMap = useMemo(() => buildDailyWeatherMap(forecast?.daily ?? []), [forecast])

  // วันที่ไม่มีอยู่ใน map (นอกช่วงพยากรณ์ 16 วัน หรือดึงข้อมูลไม่สำเร็จ) ต้องคืน null เสมอ ห้ามเดาค่า
  const getWeatherForDate = useCallback(
    (date: string): ITaskWeather | null => {
      const dailyWeather = dailyWeatherMap.get(date)
      return dailyWeather ? buildTaskWeather(dailyWeather) : null
    },
    [dailyWeatherMap],
  )

  return {
    getWeatherForDate,
    locationName: location.name,
    isLoading,
    hasForecast: dailyWeatherMap.size > 0,
  }
}
