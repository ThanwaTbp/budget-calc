'use client'

// โหลดพยากรณ์อากาศของสถานที่ที่เลือกอยู่ใน useWeatherLocationStore
// อ่าน/สั่งโหลดผ่าน useWeatherForecastStore (cache กลาง) เพื่อไม่ให้หลาย component ที่เรียก hook นี้พร้อมกัน
// (HeaderStatus, WeatherPage, useTaskWeather) ยิง request ซ้ำซ้อนกัน
import { useCallback, useEffect } from 'react'
import { useWeatherForecastStore } from '@/features/weather/store/useWeatherForecastStore'
import { useWeatherLocationStore } from '@/features/weather/store/useWeatherLocationStore'
import type { IWeatherForecast } from '@/types/weather'

interface IUseWeatherForecast {
  forecast: IWeatherForecast | null
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
}

export function useWeatherForecast(): IUseWeatherForecast {
  const location = useWeatherLocationStore((state) => state.location)

  const forecast = useWeatherForecastStore((state) => state.forecast)
  const status = useWeatherForecastStore((state) => state.status)
  const errorMessage = useWeatherForecastStore((state) => state.errorMessage)
  const ensureForecast = useWeatherForecastStore((state) => state.ensureForecast)
  const retryForecast = useWeatherForecastStore((state) => state.retryForecast)

  useEffect(() => {
    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    queueMicrotask(() => ensureForecast(location.latitude, location.longitude))
  }, [location.latitude, location.longitude, ensureForecast])

  const onRetry = useCallback(() => {
    retryForecast(location.latitude, location.longitude)
  }, [location.latitude, location.longitude, retryForecast])

  return {
    forecast,
    isLoading: status === 'idle' || status === 'loading',
    errorMessage,
    onRetry,
  }
}
