'use client'

import { ArrowLeftRight, Landmark } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useCurrencyConverter } from '@/features/market/hooks/useCurrencyConverter'
import { useCurrencyQuote } from '@/features/market/hooks/useCurrencyQuote'
import { formatMarketNumber } from '@/features/market/utils/formatMarketNumber'

interface ICurrencyOption {
  code: string
  name: string
}

interface ICurrencySelect {
  label: string
  value: string
  options: ICurrencyOption[]
  onValueChange: (value: string) => void
}

function CurrencySelect({ label, value, options, onValueChange }: ICurrencySelect) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="เลือกสกุลเงิน" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.code} value={option.code}>
              {option.code} · {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function CurrencyPanel() {
  const converter = useCurrencyConverter()
  const { data: currencyQuote, isLoading: isLoadingQuote, errorMessage: quoteErrorMessage, onRetry } = useCurrencyQuote()

  if (isLoadingQuote) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-72 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!currencyQuote) {
    return (
      <EmptyState
        icon={ArrowLeftRight}
        title="ดึงอัตราแลกเปลี่ยนไม่สำเร็จ"
        description={quoteErrorMessage ?? 'ไม่สามารถโหลดอัตราแลกเปลี่ยนได้ กรุณาลองใหม่อีกครั้ง'}
      >
        <Button onClick={onRetry}>ลองใหม่</Button>
      </EmptyState>
    )
  }

  const currencyOptions: ICurrencyOption[] = [
    { code: currencyQuote.base, name: 'บาทไทย' },
    ...currencyQuote.rates.map((rate) => ({ code: rate.code, name: rate.name })),
  ]

  return (
    <div className="flex flex-col gap-7">
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-accent/45 px-5 py-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <ArrowLeftRight className="size-4.5" />
            </span>
            <div>
              <h2 className="text-xl font-semibold tracking-tight">แปลงค่าเงิน</h2>
              <p className="text-sm text-muted-foreground">เห็นผลลัพธ์และเรตที่ใช้คำนวณในจุดเดียว</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[minmax(8rem,1fr)_minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <label className="text-sm text-muted-foreground" htmlFor="market-convert-amount">
                จำนวนเงิน
              </label>
              <Input
                id="market-convert-amount"
                inputMode="decimal"
                className="tabular"
                value={converter.amountText}
                onChange={(event) => converter.onAmountChange(event.target.value)}
              />
            </div>

            <CurrencySelect
              label="จากสกุล"
              value={converter.fromCurrency}
              options={currencyOptions}
              onValueChange={converter.onFromCurrencyChange}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="justify-self-center self-end"
              onClick={converter.onSwapCurrencies}
              aria-label="สลับสกุลเงินต้นทางและปลายทาง"
            >
              <ArrowLeftRight />
            </Button>

            <CurrencySelect
              label="เป็นสกุล"
              value={converter.toCurrency}
              options={currencyOptions}
              onValueChange={converter.onToCurrencyChange}
            />
          </div>

          <div className="flex min-h-40 flex-col justify-center border-t border-border bg-muted/30 p-5 lg:border-t-0 lg:border-l">
            {converter.isLoading && <Skeleton className="h-20 w-full rounded-lg" />}
            {!converter.isLoading && converter.errorMessage && (
              <p className="text-sm text-destructive">{converter.errorMessage}</p>
            )}
            {!converter.isLoading && !converter.errorMessage && converter.conversion && (
              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">ผลลัพธ์</span>
                <span className="tabular text-3xl font-semibold tracking-tight">
                  {formatMarketNumber(converter.conversion.result, 2)} {converter.conversion.to}
                </span>
                <span className="tabular text-sm text-muted-foreground">
                  1 {converter.conversion.from} = {formatMarketNumber(converter.conversion.rate)}{' '}
                  {converter.conversion.to}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">เรตอ้างอิงเทียบเงินบาท</h2>
            <p className="text-sm text-muted-foreground">1 บาทไทยแลกได้เท่าไรในแต่ละสกุล</p>
          </div>
          <p className="text-xs text-muted-foreground">ข้อมูล ECB วันที่ {currencyQuote.date}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {currencyQuote.rates.map((rate) => (
            <article key={rate.code} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-semibold tracking-wide">
                {rate.code}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{rate.name}</p>
                <p className="text-xs text-muted-foreground">ต่อ 1 THB</p>
              </div>
              <p className="tabular shrink-0 text-lg font-semibold">{formatMarketNumber(rate.rate)}</p>
            </article>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Landmark className="size-3.5" />
          ธนาคารกลางยุโรปไม่อัปเดตข้อมูลในวันหยุด
        </p>
      </section>
    </div>
  )
}
