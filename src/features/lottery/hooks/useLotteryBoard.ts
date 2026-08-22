'use client'

// composable หลักของหน้าตรวจหวย — จัดการโหลดรายการงวด/ผลรางวัล ตรวจเลขที่บันทึกไว้ และตรวจเลขแบบไม่บันทึก
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { checkTicket, checkTickets, isValidTicketNumber } from '@/features/lottery/utils/checkTicket'
import { useLotteryTicketStore } from '@/features/lottery/store/useLotteryTicketStore'
import type { IDrawListItem } from '@/features/lottery/type'
import type { ILotteryDraw, ITicketCheckResult } from '@/types/lottery'

interface IDrawsApiResponse {
  draws: IDrawListItem[]
}

interface IApiErrorResponse {
  message: string
}

const DEFAULT_ERROR_MESSAGE = 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'

// อ่านข้อความ error ภาษาไทยจาก response ที่ไม่ใช่ 2xx (ตาม contract ของ route handler ใน docs/SPEC.md)
async function readErrorMessage(response: Response): Promise<string> {
  const errorBody = (await response.json().catch(() => null)) as IApiErrorResponse | null
  return errorBody?.message ?? DEFAULT_ERROR_MESSAGE
}

// รวมเงินรางวัลของผลตรวจทั้งหมด แยกเป็นฟังก์ชัน pure เพื่อทดสอบได้อิสระจาก React
export function calcTotalTicketReward(checkedTickets: ITicketCheckResult[]): number {
  return checkedTickets.reduce((sumReward, checkedTicket) => sumReward + checkedTicket.totalReward, 0)
}

export function useLotteryBoard() {
  const tickets = useLotteryTicketStore((state) => state.tickets)
  const onCreateTicket = useLotteryTicketStore((state) => state.onCreate)

  const [draws, setDraws] = useState<IDrawListItem[]>([])
  const [selectedDrawId, setSelectedDrawId] = useState<string | null>(null)
  const [draw, setDraw] = useState<ILotteryDraw | null>(null)
  const [isLoadingDraws, setIsLoadingDraws] = useState(true)
  const [isLoadingDraw, setIsLoadingDraw] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [quickCheckNumber, setQuickCheckNumber] = useState('')
  const [quickCheckResult, setQuickCheckResult] = useState<ITicketCheckResult | null>(null)

  // โหลดรายการงวดทั้งหมด แล้วเลือกงวดล่าสุด (ตัวแรกของลิสต์ เพราะ route handler เรียงใหม่→เก่าให้แล้ว) เป็นค่าเริ่มต้น
  const loadDraws = useCallback(async () => {
    setIsLoadingDraws(true)
    setErrorMessage(null)

    try {
      const response = await fetch('/api/lottery/draws')
      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const data = (await response.json()) as IDrawsApiResponse
      setDraws(data.draws)

      if (data.draws.length > 0) {
        setSelectedDrawId(data.draws[0].id)
      } else {
        setIsLoadingDraws(false)
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
      setIsLoadingDraws(false)
    }
  }, [])

  useEffect(() => {
    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    queueMicrotask(loadDraws)
  }, [loadDraws])

  // เก็บ request ของงวดที่กำลังโหลดอยู่ เพื่อยกเลิกตัวเก่าเมื่อผู้ใช้สลับงวด
  // ถ้าไม่ยกเลิก ผลของงวดเก่าที่มาช้ากว่าจะเขียนทับผลงวดใหม่ ทำให้หน้าจอโชว์ผลรางวัลผิดงวด
  const activeDrawRequestRef = useRef<AbortController | null>(null)

  // โหลดผลรางวัลเต็มงวดของ drawId ที่เลือกอยู่
  const loadDraw = useCallback(async (drawId: string) => {
    activeDrawRequestRef.current?.abort()
    const requestController = new AbortController()
    activeDrawRequestRef.current = requestController

    setIsLoadingDraw(true)
    setErrorMessage(null)

    try {
      const response = await fetch(`/api/lottery/draws/${drawId}`, { signal: requestController.signal })
      if (!response.ok) {
        throw new Error(await readErrorMessage(response))
      }

      const data = (await response.json()) as ILotteryDraw
      if (requestController.signal.aborted) return
      setDraw(data)
    } catch (error) {
      // ถูกยกเลิกเพราะผู้ใช้สลับงวด ไม่ใช่ความผิดพลาดจริง จึงไม่ต้องแตะ state ใดๆ
      if (requestController.signal.aborted) return
      setDraw(null)
      setErrorMessage(error instanceof Error ? error.message : DEFAULT_ERROR_MESSAGE)
    } finally {
      if (!requestController.signal.aborted) {
        setIsLoadingDraw(false)
        // ปิดสถานะโหลดรายการงวดพร้อมกันด้วย กันหน้าค้างที่ true ถ้าเข้ามาที่นี่จากขั้นโหลดรายการงวดสำเร็จ
        setIsLoadingDraws(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedDrawId) return
    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    queueMicrotask(() => loadDraw(selectedDrawId))

    return () => {
      activeDrawRequestRef.current?.abort()
    }
  }, [selectedDrawId, loadDraw])

  const onSelectDraw = useCallback((drawId: string) => {
    setSelectedDrawId(drawId)
  }, [])

  // ลองใหม่ตามขั้นที่ล้มเหลวจริง — ยังไม่มีรายการงวดเลยแปลว่าขั้นแรกล้มเหลว ไม่งั้นแปลว่าล้มเหลวตอนโหลดผลรางวัลของงวดที่เลือก
  const onRetry = useCallback(() => {
    if (draws.length === 0) {
      loadDraws()
      return
    }

    if (selectedDrawId) {
      loadDraw(selectedDrawId)
    }
  }, [draws.length, selectedDrawId, loadDraws, loadDraw])

  // ตรวจเลขแบบไม่บันทึก คำนวณเฉพาะตอนกดตรวจ/Enter เท่านั้น ไม่คำนวณระหว่างพิมพ์
  const onQuickCheck = useCallback(
    (numberValue: string) => {
      setQuickCheckNumber(numberValue)

      if (!draw || !isValidTicketNumber(numberValue)) {
        setQuickCheckResult(null)
        return
      }

      setQuickCheckResult(checkTicket(numberValue, draw))
    },
    [draw],
  )

  const onSaveQuickNumber = useCallback(() => {
    if (!isValidTicketNumber(quickCheckNumber)) return
    onCreateTicket({ number: quickCheckNumber, note: '' })
  }, [quickCheckNumber, onCreateTicket])

  const checkedTickets = useMemo(() => {
    if (!draw) return []
    return checkTickets(
      tickets.map((ticket) => ticket.number),
      draw,
    )
  }, [tickets, draw])

  const totalReward = useMemo(() => calcTotalTicketReward(checkedTickets), [checkedTickets])

  return {
    draws,
    selectedDrawId,
    draw,
    isLoadingDraws,
    isLoadingDraw,
    errorMessage,
    checkedTickets,
    totalReward,
    quickCheckNumber,
    quickCheckResult,
    onSelectDraw,
    onQuickCheck,
    onSaveQuickNumber,
    onRetry,
  }
}
