'use client'

// โหลดพยากรณ์อากาศของสถานที่ที่เลือกอยู่ใน useWeatherLocationStore
// ออกแบบให้หน้าวางแผนงานเอา forecast ไปใช้ต่อได้ (map วันที่งาน → พยากรณ์ของวันนั้นด้วย hook อีกตัวในรอบถัดไป)
import { useCallback, useEffect, useRef, useState } from 'react'
import { useWeatherLocationStore } from '@/features/weather/store/useWeatherLocationStore'
import type { IWeatherForecast } from '@/types/weather'

interface IApiErrorResponse {
  message: string
}

const DEFAULT_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler ใน docs/SPEC.md)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

interface IUseWeatherForecast {
  forecast: IWeatherForecast | null
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
}

export function useWeatherForecast(): IUseWeatherForecast {
  const location = useWeatherLocationStore((state) => state.location)

  const [forecast, setForecast] = useState<IWeatherForecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // เก็บ request ที่กำลังโหลดอยู่ เพื่อยกเลิกตัวเก่าเมื่อผู้ใช้สลับสถานที่
  // ถ้าไม่ยกเลิก ผลของสถานที่เก่าที่มาช้ากว่าจะเขียนทับผลของสถานที่ใหม่ ทำให้หน้าจอโชว์อากาศผิดที่
  const activeRequestRef = useRef<AbortController | null>(null)

  const loadForecast = useCallback((latitude: number, longitude: number) => {
    activeRequestRef.current?.abort()
    const requestController = new AbortController()
    activeRequestRef.current = requestController

    setIsLoading(true)
    setErrorMessage(null)

    fetch(`/api/weather/forecast?lat=${latitude}&lon=${longitude}`, { signal: requestController.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readErrorMessage(response))
        }
        return (await response.json()) as IWeatherForecast
      })
      .then((data) => {
        if (requestController.signal.aborted) return
        setForecast(data)
        setIsLoading(false)
      })
      .catch((error: unknown) => {
        // ถูกยกเลิกเพราะผู้ใช้สลับสถานที่ ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
        if (requestController.signal.aborted) return
        setForecast(null)
        setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
        setIsLoading(false)
      })
  }, [])

  useEffect(() => {
    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    queueMicrotask(() => loadForecast(location.latitude, location.longitude))

    return () => {
      activeRequestRef.current?.abort()
    }
  }, [location.latitude, location.longitude, loadForecast])

  const onRetry = useCallback(() => {
    loadForecast(location.latitude, location.longitude)
  }, [location.latitude, location.longitude, loadForecast])

  return { forecast, isLoading, errorMessage, onRetry }
}
