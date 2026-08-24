'use client'

import { useState } from 'react'
import { Fuel } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
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

  // ปั๊มที่เลือกไว้อาจไม่มีในผลลัพธ์จริง (เช่น API ไม่คืนปั๊มนั้นมาเลย) จึง fallback เป็นปั๊มแรกที่มีจริงกันหน้าจอว่างเปล่า
  const selectedStation =
    oilQuote.stations.find((station) => station.key === selectedStationKey) ?? oilQuote.stations[0]

  return (
    <div className="flex flex-col gap-4">
      <Select value={selectedStation?.key ?? DEFAULT_STATION_KEY} onValueChange={onSelectStation}>
        <SelectTrigger className="w-56">
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

      {selectedStation && (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ชนิดน้ำมัน</TableHead>
                  <TableHead className="text-right">ราคา (บาท/ลิตร)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedStation.fuels.map((fuel) => (
                  <TableRow key={fuel.key}>
                    <TableCell>{fuel.name}</TableCell>
                    <TableCell className="tabular text-right">{formatNumber(fuel.price)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 md:hidden">
            {selectedStation.fuels.map((fuel) => (
              <div
                key={fuel.key}
                className="flex items-center justify-between gap-2 rounded-xl border border-border p-4"
              >
                <span className="text-sm font-medium">{fuel.name}</span>
                <span className="tabular text-base font-semibold">{formatNumber(fuel.price)} บาท/ลิตร</span>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-sm text-muted-foreground">ข้อมูลวันที่ {oilQuote.date}</p>
    </div>
  )
}
