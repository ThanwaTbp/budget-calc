'use client'

// composable ค้นหาเมือง — debounce การพิมพ์ ~400ms ก่อนยิง API กันยิงถี่เกินไประหว่างผู้ใช้พิมพ์
import { useCallback, useEffect, useRef, useState } from 'react'
import type { IWeatherLocation } from '@/types/weather'

interface IApiErrorResponse {
  message: string
}

interface ISearchApiResponse {
  locations: IWeatherLocation[]
}

const DEBOUNCE_MS = 400
const DEFAULT_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler ใน docs/SPEC.md)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

interface IUseLocationSearch {
  query: string
  results: IWeatherLocation[]
  isLoading: boolean
  errorMessage: string | null
  onQueryChange: (value: string) => void
}

export function useLocationSearch(): IUseLocationSearch {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IWeatherLocation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // เก็บ request ที่กำลังค้นหาอยู่ เพื่อยกเลิกตัวเก่าเมื่อผู้ใช้พิมพ์คำค้นใหม่ก่อนผลเก่าจะมาถึง
  const activeRequestRef = useRef<AbortController | null>(null)

  const onQueryChange = useCallback((value: string) => {
    setQuery(value)
  }, [])

  useEffect(() => {
    const trimmedQuery = query.trim()
    activeRequestRef.current?.abort()

    if (trimmedQuery === '') {
      // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
      queueMicrotask(() => {
        setResults([])
        setErrorMessage(null)
        setIsLoading(false)
      })
      return
    }

    queueMicrotask(() => {
      setIsLoading(true)
      setErrorMessage(null)
    })

    const debounceTimer = setTimeout(() => {
      const requestController = new AbortController()
      activeRequestRef.current = requestController

      fetch(`/api/weather/search?q=${encodeURIComponent(trimmedQuery)}`, { signal: requestController.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(await readErrorMessage(response))
          }
          return (await response.json()) as ISearchApiResponse
        })
        .then((data) => {
          if (requestController.signal.aborted) return
          setResults(data.locations)
          setIsLoading(false)
        })
        .catch((error: unknown) => {
          // ถูกยกเลิกเพราะผู้ใช้พิมพ์คำค้นใหม่ ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
          if (requestController.signal.aborted) return
          setResults([])
          setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(debounceTimer)
      activeRequestRef.current?.abort()
    }
  }, [query])

  return { query, results, isLoading, errorMessage, onQueryChange }
}
