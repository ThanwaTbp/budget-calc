'use client'

import { ArrowLeftRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

// ช่องเลือกสกุลเงินหนึ่งช่อง (ใช้ทั้งฝั่งต้นทางและปลายทางของเครื่องแปลงค่าเงิน)
function CurrencySelect({ label, value, options, onValueChange }: ICurrencySelect) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-44">
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
        <Skeleton className="h-56 w-full rounded-xl" />
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

  // ตัวเลือกสกุลเงินของเครื่องแปลง เพิ่ม THB (สกุลฐาน) เข้าไปเองเพราะ Frankfurter ไม่คืน THB มาในรายการ rates
  const currencyOptions: ICurrencyOption[] = [
    { code: currencyQuote.base, name: 'บาทไทย' },
    ...currencyQuote.rates.map((rate) => ({ code: rate.code, name: rate.name })),
  ]

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>เครื่องแปลงค่าเงิน</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1.5">
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
              label="จาก"
              value={converter.fromCurrency}
              options={currencyOptions}
              onValueChange={converter.onFromCurrencyChange}
            />

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="self-end"
              onClick={converter.onSwapCurrencies}
              aria-label="สลับสกุลเงินต้นทางและปลายทาง"
            >
              <ArrowLeftRight className="size-4" />
            </Button>

            <CurrencySelect
              label="เป็น"
              value={converter.toCurrency}
              options={currencyOptions}
              onValueChange={converter.onToCurrencyChange}
            />
          </div>

          {converter.isLoading && <Skeleton className="h-20 w-full rounded-xl" />}

          {!converter.isLoading && converter.errorMessage && (
            <p className="text-sm text-destructive">{converter.errorMessage}</p>
          )}

          {!converter.isLoading && !converter.errorMessage && converter.conversion && (
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-muted/40 p-4">
              <span className="tabular text-3xl font-bold">
                {formatMarketNumber(converter.conversion.result, 2)} {converter.conversion.to}
              </span>
              <span className="tabular text-sm text-muted-foreground">
                1 {converter.conversion.from} = {formatMarketNumber(converter.conversion.rate)} {converter.conversion.to}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">ตารางเรตอ้างอิง (เทียบกับ THB)</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>สกุลเงิน</TableHead>
              <TableHead className="text-right">1 THB</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currencyQuote.rates.map((rate) => (
              <TableRow key={rate.code}>
                <TableCell>
                  {rate.name} ({rate.code})
                </TableCell>
                <TableCell className="tabular text-right">{formatMarketNumber(rate.rate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <p className="text-sm text-muted-foreground">
          ข้อมูลวันที่ {currencyQuote.date} · ข้อมูลจาก ECB ไม่อัปเดตในวันหยุด
        </p>
      </div>
    </div>
  )
}
