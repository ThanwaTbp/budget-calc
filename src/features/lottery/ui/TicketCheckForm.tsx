'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Ticket } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isValidTicketNumber } from '@/features/lottery/utils/checkTicket'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { ITicketCheckResult } from '@/types/lottery'

interface ITicketCheckForm {
  quickCheckResult: ITicketCheckResult | null
  isQuickNumberSaved: boolean
  isDrawLoaded: boolean
  onQuickCheck: (numberValue: string) => void
  onSaveQuickNumber: () => void
}

// ช่องกรอกเลข 6 หลักตรวจแบบไม่บันทึก — ผลลัพธ์คำนวณเฉพาะตอนกดตรวจ/Enter ไม่คำนวณระหว่างพิมพ์
export function TicketCheckForm({
  quickCheckResult,
  isQuickNumberSaved,
  isDrawLoaded,
  onQuickCheck,
  onSaveQuickNumber,
}: ITicketCheckForm) {
  const [inputValue, setInputValue] = useState('')
  const [showLengthWarning, setShowLengthWarning] = useState(false)

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    // กรองให้เหลือแต่ตัวเลข และจำกัดไม่เกิน 6 หลัก
    const numericValue = event.target.value.replace(/\D/g, '').slice(0, 6)
    setInputValue(numericValue)
    setShowLengthWarning(false)
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isDrawLoaded) return

    if (!isValidTicketNumber(inputValue)) {
      setShowLengthWarning(true)
      return
    }

    setShowLengthWarning(false)
    onQuickCheck(inputValue)
  }

  const onSaveClick = () => {
    onSaveQuickNumber()
    toast.success('บันทึกเลขเรียบร้อยแล้ว')
  }

  const hasWinningResult = quickCheckResult !== null && quickCheckResult.hits.length > 0
  const hasCheckedResult = quickCheckResult !== null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <label htmlFor="quick-check-number" className="text-sm font-medium">
          ตรวจเลข
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="quick-check-number"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={inputValue}
            onChange={onInputChange}
            className="tabular text-center text-2xl tracking-[0.3em]"
          />
          <Button type="submit" size="lg" disabled={!isDrawLoaded}>
            ตรวจ
          </Button>
        </div>
        {showLengthWarning ? (
          <p className="text-sm text-destructive">กรอกเลขให้ครบ 6 หลักก่อนตรวจ</p>
        ) : (
          <p className="text-sm text-muted-foreground">กรอกเลข 6 หลัก</p>
        )}
      </form>

      {hasCheckedResult && quickCheckResult && (
        <div
          className={cn(
            'flex flex-col gap-2 rounded-lg border p-3',
            hasWinningResult ? 'border-income bg-income-muted' : 'border-border bg-muted/40',
          )}
        >
          {hasWinningResult ? (
            <>
              <ul className="flex flex-col gap-1">
                {quickCheckResult.hits.map((hit) => (
                  <li
                    key={`${hit.prizeId}-${hit.matchedNumber}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{hit.prizeName}</span>
                    <span className="tabular font-medium">{formatCurrency(hit.reward)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-3 border-t border-income/30 pt-2">
                <span className="text-sm font-medium">ยอดรวม</span>
                <span className="tabular text-xl font-bold text-income">
                  {formatCurrency(quickCheckResult.totalReward)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">ไม่ถูกรางวัล</p>
          )}

          {!isQuickNumberSaved && (
            <Button variant="outline" size="sm" onClick={onSaveClick} className="self-start">
              <Ticket />
              บันทึกเลขนี้
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
