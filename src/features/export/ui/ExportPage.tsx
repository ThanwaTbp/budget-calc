'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useExportBoard } from '@/features/export/hooks/useExportBoard'
import { ExportDatasetCard } from '@/features/export/ui/ExportDatasetCard'
import { ExportRangeToolbar } from '@/features/export/ui/ExportRangeToolbar'

export function ExportPage() {
  const isHydrated = useHydrated()
  const {
    fromDate,
    toDate,
    onChangeFromDate,
    onChangeToDate,
    onSelectThisMonth,
    onSelectThisYear,
    onSelectAllTime,
    datasets,
    onDownload,
  } = useExportBoard()

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ส่งออกข้อมูล" description="ดาวน์โหลดข้อมูลเป็นไฟล์ CSV เปิดใน Excel ได้ทันที" />

      <ExportRangeToolbar
        fromDate={fromDate}
        toDate={toDate}
        onChangeFromDate={onChangeFromDate}
        onChangeToDate={onChangeToDate}
        onSelectThisMonth={onSelectThisMonth}
        onSelectThisYear={onSelectThisYear}
        onSelectAllTime={onSelectAllTime}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {datasets.map((dataset) => (
          <ExportDatasetCard key={dataset.key} dataset={dataset} onDownload={onDownload} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        ไฟล์เป็น CSV รหัส UTF-8 เปิดด้วย Excel หรือ Google Sheets ได้โดยตรง
      </p>
    </div>
  )
}
