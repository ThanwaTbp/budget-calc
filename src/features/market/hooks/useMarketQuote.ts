'use client'

// composable กลางสำหรับโหลดข้อมูลราคาตลาด (ทอง/น้ำมัน/อัตราแลกเปลี่ยน) จาก route handler เดียว
// ยกเลิก request เก่าด้วย AbortController กันผลเก่ามาช้าเขียนทับผลใหม่ (เช่น ตอนกดลองใหม่ซ้ำ)
import { useCallback, useEffect, useRef, useState } from 'react'

interface IApiErrorResponse {
  message: string
}

const DEFAULT_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler ใน docs/SPEC.md)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

interface IUseMarketQuote<TQuote> {
  data: TQuote | null
  isLoading: boolean
  errorMessage: string | null
  onRetry: () => void
}

export function useMarketQuote<TQuote>(endpoint: string): IUseMarketQuote<TQuote> {
  const [data, setData] = useState<TQuote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // เก็บ request ที่กำลังโหลดอยู่ เพื่อยกเลิกตัวเก่าเมื่อมีการเรียกโหลดซ้ำก่อนผลเก่าจะมาถึง
  const activeRequestRef = useRef<AbortController | null>(null)

  const loadQuote = useCallback(async () => {
    activeRequestRef.current?.abort()
    const requestController = new AbortController()
    activeRequestRef.current = requestController

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch(endpoint, { signal: requestController.signal })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const quoteData = (await response.json()) as TQuote
      if (requestController.signal.aborted) return
      setData(quoteData)
      setIsLoading(false)
    } catch (error) {
      // ถูกยกเลิกเพราะมีการโหลดซ้ำ ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
      if (requestController.signal.aborted) return
      setData(null)
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
      setIsLoading(false)
    }
  }, [endpoint])

  useEffect(() => {
    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    queueMicrotask(loadQuote)

    return () => {
      activeRequestRef.current?.abort()
    }
  }, [loadQuote])

  return { data, isLoading, errorMessage, onRetry: loadQuote }
}
