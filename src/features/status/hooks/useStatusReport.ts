'use client'

// composable หลักของหน้าสถานะระบบ — โหลดรายงานสถานะ, ยกเลิก request เก่าเมื่อรีเฟรชซ้ำ, และ auto-refresh ทุก 60 วินาที
import { useCallback, useEffect, useRef, useState } from 'react'
import type { IStatusReport } from '@/types/status'

const DEFAULT_ERROR_MESSAGE = 'ตรวจสอบสถานะระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
const AUTO_REFRESH_INTERVAL_MS = 60000

interface IApiErrorResponse {
  message: string
}

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

interface IUseStatusReport {
  report: IStatusReport | null
  isLoading: boolean
  errorMessage: string | null
  isAutoRefreshEnabled: boolean
  onToggleAutoRefresh: () => void
  onRefresh: () => void
}

export function useStatusReport(): IUseStatusReport {
  const [report, setReport] = useState<IStatusReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(true)

  // เก็บ request ที่กำลังโหลดอยู่ เพื่อยกเลิกตัวเก่าเมื่อกดรีเฟรชซ้ำก่อนผลเก่าจะมาถึง
  // ไม่ยกเลิกจะทำให้ผลของ request เก่าที่มาช้ากว่าเขียนทับผลของ request ใหม่กว่า
  const activeRequestRef = useRef<AbortController | null>(null)

  const loadReport = useCallback(async () => {
    activeRequestRef.current?.abort()
    const requestController = new AbortController()
    activeRequestRef.current = requestController

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/status', { signal: requestController.signal })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const data = (await response.json()) as IStatusReport
      if (requestController.signal.aborted) return
      setReport(data)
      setIsLoading(false)
    } catch (error) {
      // ถูกยกเลิกเพราะมีการโหลดซ้ำ ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
      if (requestController.signal.aborted) return
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    queueMicrotask(loadReport)

    return () => {
      activeRequestRef.current?.abort()
    }
  }, [loadReport])

  // auto-refresh ทุก 60 วินาทีเมื่อเปิดสวิตช์ไว้ — ต้อง clearInterval ตอนปิดสวิตช์หรือ unmount กันโหลดทิ้งขว้าง
  useEffect(() => {
    if (!isAutoRefreshEnabled) return

    const intervalId = setInterval(() => {
      loadReport()
    }, AUTO_REFRESH_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [isAutoRefreshEnabled, loadReport])

  const onToggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled((previousEnabled) => !previousEnabled)
  }, [])

  return {
    report,
    isLoading,
    errorMessage,
    isAutoRefreshEnabled,
    onToggleAutoRefresh,
    onRefresh: loadReport,
  }
}
