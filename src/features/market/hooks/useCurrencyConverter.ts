'use client'

// composable เครื่องแปลงค่าเงิน — debounce การพิมพ์จำนวนเงิน/เปลี่ยนสกุลเงิน ~400ms ก่อนยิง API กันยิงถี่เกินไป
// ยกเลิก request เก่าด้วย AbortController ทุกครั้งที่พารามิเตอร์เปลี่ยน กันผลเก่ามาช้าเขียนทับผลใหม่
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ICurrencyConversion } from '@/types/market'

interface IApiErrorResponse {
  message: string
}

const DEBOUNCE_MS = 400
const DEFAULT_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
const DEFAULT_FROM_CURRENCY = 'THB'
const DEFAULT_TO_CURRENCY = 'USD'
const DEFAULT_AMOUNT_TEXT = '100'

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler ใน docs/SPEC.md)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

interface IUseCurrencyConverter {
  amountText: string
  fromCurrency: string
  toCurrency: string
  conversion: ICurrencyConversion | null
  isLoading: boolean
  errorMessage: string | null
  onAmountChange: (value: string) => void
  onFromCurrencyChange: (value: string) => void
  onToCurrencyChange: (value: string) => void
  onSwapCurrencies: () => void
}

export function useCurrencyConverter(): IUseCurrencyConverter {
  const [amountText, setAmountText] = useState(DEFAULT_AMOUNT_TEXT)
  const [fromCurrency, setFromCurrency] = useState(DEFAULT_FROM_CURRENCY)
  const [toCurrency, setToCurrency] = useState(DEFAULT_TO_CURRENCY)
  const [conversion, setConversion] = useState<ICurrencyConversion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // เก็บ request ของการแปลงที่กำลังโหลดอยู่ เพื่อยกเลิกตัวเก่าเมื่อผู้ใช้เปลี่ยนจำนวนเงิน/สกุลเงินใหม่ก่อนผลเก่าจะมาถึง
  const activeRequestRef = useRef<AbortController | null>(null)

  const onAmountChange = useCallback((value: string) => setAmountText(value), [])
  const onFromCurrencyChange = useCallback((value: string) => setFromCurrency(value), [])
  const onToCurrencyChange = useCallback((value: string) => setToCurrency(value), [])

  // สลับทิศทางสกุลต้นทาง-ปลายทาง
  const onSwapCurrencies = useCallback(() => {
    setFromCurrency(toCurrency)
    setToCurrency(fromCurrency)
  }, [fromCurrency, toCurrency])

  useEffect(() => {
    activeRequestRef.current?.abort()

    const amount = Number(amountText)
    if (!Number.isFinite(amount) || amount <= 0) {
      // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
      queueMicrotask(() => {
        setConversion(null)
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

      const params = new URLSearchParams({ from: fromCurrency, to: toCurrency, amount: String(amount) })

      fetch(`/api/market/convert?${params.toString()}`, { signal: requestController.signal })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(await readErrorMessage(response))
          }
          return (await response.json()) as ICurrencyConversion
        })
        .then((data) => {
          if (requestController.signal.aborted) return
          setConversion(data)
          setIsLoading(false)
        })
        .catch((error: unknown) => {
          // ถูกยกเลิกเพราะผู้ใช้เปลี่ยนค่าใหม่ ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
          if (requestController.signal.aborted) return
          setConversion(null)
          setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
          setIsLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => {
      clearTimeout(debounceTimer)
      activeRequestRef.current?.abort()
    }
  }, [amountText, fromCurrency, toCurrency])

  return {
    amountText,
    fromCurrency,
    toCurrency,
    conversion,
    isLoading,
    errorMessage,
    onAmountChange,
    onFromCurrencyChange,
    onToCurrencyChange,
    onSwapCurrencies,
  }
}
