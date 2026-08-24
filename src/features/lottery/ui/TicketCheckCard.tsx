'use client'

import { useState } from 'react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { CalendarDays, Check, PartyPopper, SearchX } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { formatCurrency } from '@/utils/format'
import { cn } from '@/lib/utils'
import type { ITicketCheckResult } from '@/types/lottery'

interface ITicketCheckCard {
  drawLabel: string | null
  quickCheckResult: ITicketCheckResult | null
  isQuickNumberSaved: boolean
  isDrawLoaded: boolean
  onQuickCheck: (numberValue: string) => void
  onSaveQuickNumber: () => void
}

// HERO ของหน้า — ช่องกรอกเลข 6 หลักทีละกล่อง กรอกครบแล้วตรวจให้อัตโนมัติทันที (ยังมีปุ่มไว้กดซ้ำได้)
export function TicketCheckCard({
  drawLabel,
  quickCheckResult,
  isQuickNumberSaved,
  isDrawLoaded,
  onQuickCheck,
  onSaveQuickNumber,
}: ITicketCheckCard) {
  const [inputValue, setInputValue] = useState('')

  const isComplete = inputValue.length === 6
  const hasWinningResult = isComplete && quickCheckResult !== null && quickCheckResult.hits.length > 0
  const hasCheckedResult = isComplete && quickCheckResult !== null

  const onOtpChange = (numberValue: string) => {
    setInputValue(numberValue)
    onQuickCheck(numberValue)
  }

  const onClear = () => {
    setInputValue('')
    onQuickCheck('')
  }

  const onCheckClick = () => {
    onQuickCheck(inputValue)
  }

  const onSaveClick = () => {
    onSaveQuickNumber()
    toast.success('บันทึกเลขเรียบร้อยแล้ว')
  }

  return (
    <div className="flex flex-col items-center gap-5 rounded-xl border border-primary/15 bg-card p-6 shadow-sm ring-1 ring-primary/15 sm:p-8">
      {drawLabel && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          งวดวันที่ {drawLabel}
        </p>
      )}

      <InputOTP
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS}
        value={inputValue}
        onChange={onOtpChange}
        disabled={!isDrawLoaded}
        containerClassName="justify-center"
      >
        <InputOTPGroup>
          {Array.from({ length: 6 }).map((_, slotIndex) => (
            <InputOTPSlot key={slotIndex} index={slotIndex} className="size-12 text-2xl font-semibold tabular sm:size-14 sm:text-2xl" />
          ))}
        </InputOTPGroup>
      </InputOTP>

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={onCheckClick} disabled={!isDrawLoaded || !isComplete}>
          ตรวจรางวัล
        </Button>
        {inputValue.length > 0 && (
          <Button variant="ghost" onClick={onClear}>
            ล้าง
          </Button>
        )}
      </div>

      {!isComplete && <p className="text-sm text-muted-foreground">กรอกให้ครบ 6 หลัก</p>}

      {hasCheckedResult && quickCheckResult && (
        <div
          className={cn(
            'w-full max-w-xl rounded-xl border p-5',
            hasWinningResult ? 'border-income/40 bg-income-muted' : 'border-border bg-muted/40',
          )}
        >
          {hasWinningResult ? (
            <>
              <div className="flex items-center gap-2 font-semibold text-income">
                <PartyPopper className="size-5" />
                ยินดีด้วย! ถูกรางวัล
              </div>

              <ul className="mt-3 flex flex-col gap-2">
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

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-income/30 pt-3">
                <span className="text-sm font-medium">รวมทั้งสิ้น</span>
                <span className="tabular text-3xl font-bold text-income">
                  {formatCurrency(quickCheckResult.totalReward)}
                </span>
              </div>

              {isQuickNumberSaved ? (
                <p className="mt-3 flex items-center gap-1.5 text-sm text-income">
                  <Check className="size-4" />
                  บันทึกไว้แล้ว
                </p>
              ) : (
                <Button variant="outline" size="sm" onClick={onSaveClick} className="mt-3">
                  บันทึกเลขนี้ไว้
                </Button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 text-center">
              <SearchX className="size-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">ไม่ถูกรางวัลในงวดนี้</p>

              {isQuickNumberSaved ? (
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Check className="size-4" />
                  บันทึกไว้แล้ว
                </p>
              ) : (
                <Button variant="outline" size="sm" onClick={onSaveClick}>
                  บันทึกเลขนี้ไว้
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
