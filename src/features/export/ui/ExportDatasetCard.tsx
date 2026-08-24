'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { IExportDataset } from '@/features/export/type'

interface IExportDatasetCard {
  dataset: IExportDataset
  onDownload: (dataset: IExportDataset) => void
}

// การ์ดของชุดข้อมูลหนึ่งชุด — โชว์จำนวนแถวที่จะได้ตามช่วงเวลาที่เลือก แล้วปิดปุ่มดาวน์โหลดถ้าไม่มีข้อมูล
export function ExportDatasetCard({ dataset, onDownload }: IExportDatasetCard) {
  const Icon = dataset.icon
  const rowCount = dataset.table.rows.length
  const isDisabled = rowCount === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-semibold tracking-tight">{dataset.title}</p>
          <p className="text-sm text-muted-foreground">{dataset.description}</p>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {dataset.hasDateRange ? 'ตามช่วงเวลาที่เลือก' : 'ส่งออกทั้งหมด ไม่ขึ้นกับช่วงเวลา'}
          </span>
          <span className="tabular font-medium">{rowCount} รายการ</span>
        </div>

        <Button type="button" disabled={isDisabled} onClick={() => onDownload(dataset)} className="gap-2">
          <Download className="size-4" />
          {isDisabled ? 'ไม่มีข้อมูลในช่วงที่เลือก' : 'ดาวน์โหลด CSV'}
        </Button>
      </CardContent>
    </Card>
  )
}
