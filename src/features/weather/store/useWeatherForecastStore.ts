'use client'

// cache พยากรณ์อากาศระดับ store กลาง — ป้องกันไม่ให้แต่ละ component ที่เรียก useWeatherForecast() ยิง
// GET /api/weather/forecast ซ้ำซ้อนกัน (เดิม HeaderStatus, WeatherPage, useTaskWeather เรียกแยกกันคนละ instance)
// ไม่ persist ไม่ sync เพราะเป็นแค่ cache ชั่วคราวของหน้าจอปัจจุบัน ไม่ใช่ข้อมูลทางธุรกิจ
import { create } from 'zustand'
import type { IWeatherForecast } from '@/types/weather'

export type WeatherForecastStatus = 'idle' | 'loading' | 'success' | 'error'

// ข้อมูลเก่าเกิน 10 นาทีถือว่าล้าสมัย ต้องโหลดใหม่
const CACHE_TTL_MS = 10 * 60 * 1000
const DEFAULT_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

interface IApiErrorResponse {
  message: string
}

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler ใน docs/SPEC.md)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

// คีย์ระบุพิกัดแบบตรงตัว ใช้เทียบว่าข้อมูลใน cache เป็นของสถานที่เดียวกับที่กำลังขอหรือไม่
function buildLocationKey(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`
}

interface IWeatherForecastStore {
  forecast: IWeatherForecast | null
  fetchedAt: number | null
  locationKey: string | null
  status: WeatherForecastStatus
  errorMessage: string | null
  // โหลดเฉพาะเมื่อยังไม่มีข้อมูลของพิกัดนี้ ข้อมูลเก่าเกิน 10 นาที หรือยังไม่มี request ทำงานอยู่ให้พิกัดนี้
  ensureForecast: (latitude: number, longitude: number) => void
  // บังคับโหลดใหม่เสมอ ไม่เช็ค cache (ใช้กับปุ่ม 'ลองใหม่')
  retryForecast: (latitude: number, longitude: number) => void
}

export const useWeatherForecastStore = create<IWeatherForecastStore>()((set, get) => {
  // เก็บ request ที่กำลังโหลดอยู่ไว้ในตัวแปรปิดล้อม (ไม่ใช่ state) เพื่อยกเลิกตัวเก่าเมื่อต้องโหลดพิกัดใหม่
  // ถ้าไม่ยกเลิก ผลของพิกัดเก่าที่มาช้ากว่าจะเขียนทับผลของพิกัดใหม่ ทำให้หน้าจอโชว์อากาศผิดที่
  let activeRequestController: AbortController | null = null

  function fetchAndStore(locationKey: string, latitude: number, longitude: number) {
    activeRequestController?.abort()
    const requestController = new AbortController()
    activeRequestController = requestController

    set({ status: 'loading', errorMessage: null })

    fetch(`/api/weather/forecast?lat=${latitude}&lon=${longitude}`, { signal: requestController.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await readErrorMessage(response))
        }
        return (await response.json()) as IWeatherForecast
      })
      .then((data) => {
        // ถูกยกเลิกเพราะมีการขอพิกัดใหม่แทนที่ ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
        if (requestController.signal.aborted) return
        set({ forecast: data, fetchedAt: Date.now(), locationKey, status: 'success', errorMessage: null })
      })
      .catch((error: unknown) => {
        if (requestController.signal.aborted) return
        set({
          forecast: null,
          locationKey,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE,
        })
      })
  }

  return {
    forecast: null,
    fetchedAt: null,
    locationKey: null,
    status: 'idle',
    errorMessage: null,

    ensureForecast: (latitude, longitude) => {
      const locationKey = buildLocationKey(latitude, longitude)
      const state = get()

      const isSameLocation = state.locationKey === locationKey
      const isFresh = isSameLocation && state.fetchedAt !== null && Date.now() - state.fetchedAt < CACHE_TTL_MS
      const isAlreadyLoading = isSameLocation && state.status === 'loading'

      // มีของสดอยู่แล้ว หรือมี request ให้พิกัดนี้ทำงานอยู่แล้ว ไม่ต้องยิงซ้ำ
      if (isFresh || isAlreadyLoading) return

      fetchAndStore(locationKey, latitude, longitude)
    },

    retryForecast: (latitude, longitude) => {
      fetchAndStore(buildLocationKey(latitude, longitude), latitude, longitude)
    },
  }
})
