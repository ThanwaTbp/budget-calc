'use client'

import { useState } from 'react'
import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { CalendarDays, Check, PartyPopper, ScanLine, SearchX, ShieldCheck, Ticket } from 'lucide-react'
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

// HERO ของหน้า — วางองค์ประกอบเหมือนใบสลาก: หัวงวด, เลข 6 หลัก และผลตรวจในพื้นที่เดียวกัน
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
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-dashed border-primary/25 bg-accent/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Ticket className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">ตรวจเลขสลากของคุณ</h2>
            <p className="text-sm text-muted-foreground">กรอกครบ 6 หลัก แล้วรู้ผลทันที</p>
          </div>
        </div>

        {drawLabel && (
          <p className="flex h-9 w-fit items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-medium shadow-sm">
            <CalendarDays className="size-4 text-primary" />
            งวด {drawLabel}
          </p>
        )}
      </div>

      <div className="grid items-center gap-6 px-5 py-7 sm:px-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-10 lg:px-10 lg:py-9">
        <div className="flex min-w-0 flex-col items-center gap-4 lg:items-start">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ScanLine className="size-4 text-primary" />
            เลขสลาก 6 หลัก
          </div>

          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={inputValue}
            onChange={onOtpChange}
            disabled={!isDrawLoaded}
            containerClassName="w-full justify-center lg:justify-start"
          >
            <InputOTPGroup className="gap-1.5 sm:gap-2">
              {Array.from({ length: 6 }).map((_, slotIndex) => (
                <InputOTPSlot
                  key={slotIndex}
                  index={slotIndex}
                  className="tabular size-11 rounded-xl border bg-background text-xl font-bold shadow-xs first:rounded-xl first:border last:rounded-xl sm:size-14 sm:text-2xl"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-income" />
            ตรวจจากผลรางวัลของงวดที่เลือก
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center lg:w-44 lg:flex-col">
          <Button size="lg" className="h-12" onClick={onCheckClick} disabled={!isDrawLoaded || !isComplete}>
            ตรวจรางวัล
          </Button>
          {inputValue.length > 0 ? (
            <Button variant="ghost" className="h-11" onClick={onClear}>
              ล้างเลข
            </Button>
          ) : (
            <p className="py-2 text-center text-sm text-muted-foreground">กรอกให้ครบ 6 หลัก</p>
          )}
        </div>
      </div>

      {hasCheckedResult && quickCheckResult && (
        <div className="border-t border-dashed border-border px-5 py-6 sm:px-7 lg:px-10">
          <div
            className={cn(
              'mx-auto max-w-3xl rounded-2xl border p-5 sm:p-6',
              hasWinningResult ? 'border-income/40 bg-income-muted' : 'border-border bg-muted/45',
            )}
          >
            {hasWinningResult ? (
              <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-income">
                    <PartyPopper className="size-5" />
                    ยินดีด้วย! ถูกรางวัล
                  </div>

                  <ul className="mt-3 flex flex-col gap-2">
                    {quickCheckResult.hits.map((hit) => (
                      <li key={`${hit.prizeId}-${hit.matchedNumber}`} className="flex items-center gap-2 text-sm">
                        <Check className="size-4 shrink-0 text-income" />
                        <span>{hit.prizeName}</span>
                        <span className="tabular ml-auto font-medium">{formatCurrency(hit.reward)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-medium text-income">รวมเงินรางวัล</p>
                  <p className="tabular mt-1 text-3xl font-bold tracking-tight text-income">
                    {formatCurrency(quickCheckResult.totalReward)}
                  </p>
                  {isQuickNumberSaved ? (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-income sm:justify-end">
                      <Check className="size-4" />
                      บันทึกไว้แล้ว
                    </p>
                  ) : (
                    <Button variant="outline" size="sm" onClick={onSaveClick} className="mt-3">
                      บันทึกเลขนี้ไว้
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <SearchX className="size-5" />
                </span>
                <div>
                  <p className="font-medium">ไม่ถูกรางวัลในงวดนี้</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">บันทึกเลขไว้ตรวจงวดถัดไปได้</p>
                </div>

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
        </div>
      )}
    </section>
  )
}
