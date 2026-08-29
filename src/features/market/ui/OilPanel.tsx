'use client'

import { useState } from 'react'
import { Droplets, Fuel } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/common/EmptyState'
import { useOilQuote } from '@/features/market/hooks/useOilQuote'
import { formatNumber } from '@/utils/format'

const DEFAULT_STATION_KEY = 'ptt'

export function OilPanel() {
  const { data: oilQuote, isLoading, errorMessage, onRetry } = useOilQuote()
  const [selectedStationKey, setSelectedStationKey] = useState(DEFAULT_STATION_KEY)

  const onSelectStation = (stationKey: string) => setSelectedStationKey(stationKey)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, itemIndex) => (
            <Skeleton key={itemIndex} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!oilQuote) {
    return (
      <EmptyState
        icon={Fuel}
        title="ดึงราคาน้ำมันไม่สำเร็จ"
        description={errorMessage ?? 'ไม่สามารถโหลดราคาน้ำมันได้ กรุณาลองใหม่อีกครั้ง'}
      >
        <Button onClick={onRetry}>ลองใหม่</Button>
      </EmptyState>
    )
  }

  // ปั๊มที่เลือกไว้อาจไม่มีในผลลัพธ์จริง จึง fallback เป็นปั๊มแรกที่มีจริงกันหน้าจอว่างเปล่า
  const selectedStation =
    oilQuote.stations.find((station) => station.key === selectedStationKey) ?? oilQuote.stations[0]

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Fuel className="size-4.5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">ราคาหน้าปั๊ม</h2>
            <p className="text-sm text-muted-foreground">ข้อมูลวันที่ {oilQuote.date}</p>
          </div>
        </div>

        <Select value={selectedStation?.key ?? DEFAULT_STATION_KEY} onValueChange={onSelectStation}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="เลือกปั๊มน้ำมัน" />
          </SelectTrigger>
          <SelectContent>
            {oilQuote.stations.map((station) => (
              <SelectItem key={station.key} value={station.key}>
                {station.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>

      {selectedStation && (
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">สถานีบริการ</p>
              <h3 className="text-xl font-semibold tracking-tight">{selectedStation.name}</h3>
            </div>
            <span className="text-sm text-muted-foreground">{selectedStation.fuels.length} ประเภท</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selectedStation.fuels.map((fuel) => (
              <article
                key={fuel.key}
                className="group flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-primary/35"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground">
                    <Droplets className="size-4" />
                  </span>
                  <p className="line-clamp-2 text-sm font-medium">{fuel.name}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tabular text-xl font-semibold tracking-tight">{formatNumber(fuel.price)}</p>
                  <p className="text-xs text-muted-foreground">บาท/ลิตร</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
