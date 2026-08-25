'use client'

import { CalendarDays, List, Rows3 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { PlannerViewMode } from '@/features/planner/type'

interface IPlannerViewToggle {
  viewMode: PlannerViewMode
  onViewModeChange: (mode: PlannerViewMode) => void
}

// สลับมุมมองระหว่างงานรายวัน, ลิสต์งานรายเดือน และปฏิทินทีมขนาดใหญ่
export function PlannerViewToggle({ viewMode, onViewModeChange }: IPlannerViewToggle) {
  return (
    <Tabs value={viewMode} onValueChange={(value) => onViewModeChange(value as PlannerViewMode)}>
      <TabsList className="w-full sm:w-fit">
        <TabsTrigger value="day">
          <List />
          รายวัน
        </TabsTrigger>
        <TabsTrigger value="month">
          <Rows3 />
          รายเดือน
        </TabsTrigger>
        <TabsTrigger value="calendar">
          <CalendarDays />
          ปฏิทิน
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
