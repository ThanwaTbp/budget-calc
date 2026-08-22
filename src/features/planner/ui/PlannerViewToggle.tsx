'use client'

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlannerViewMode } from '@/features/planner/type'

interface IPlannerViewToggle {
  viewMode: PlannerViewMode
  onViewModeChange: (mode: PlannerViewMode) => void
}

// สลับมุมมองลิสต์งานระหว่างรายวัน (งานของวันที่เลือกบนปฏิทิน) กับรายเดือน (งานทั้งเดือนจัดกลุ่มตามวัน)
export function PlannerViewToggle({ viewMode, onViewModeChange }: IPlannerViewToggle) {
  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as PlannerViewMode)}>
      <TabsList>
        <TabsTrigger value="day">รายวัน</TabsTrigger>
        <TabsTrigger value="month">รายเดือน</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
