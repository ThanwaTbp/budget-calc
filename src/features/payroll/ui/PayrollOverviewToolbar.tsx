'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface IPayrollOverviewToolbar {
  employeeKeyword: string
  onEmployeeKeywordChange: (keyword: string) => void
  showEmployeesWithoutEntries: boolean
  onToggleShowEmployeesWithoutEntries: () => void
}

// แถบควบคุมของแท็บภาพรวมทั้งหมด: ค้นหาชื่อพนักงาน + สวิตช์แสดงคนที่ไม่มีรอบจ่ายในงวดนี้
export function PayrollOverviewToolbar({
  employeeKeyword,
  onEmployeeKeywordChange,
  showEmployeesWithoutEntries,
  onToggleShowEmployeesWithoutEntries,
}: IPayrollOverviewToolbar) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={employeeKeyword}
          onChange={(event) => onEmployeeKeywordChange(event.target.value)}
          placeholder="ค้นหาพนักงาน"
          className="pl-9 sm:w-56"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="show-employees-without-entries"
          checked={showEmployeesWithoutEntries}
          onCheckedChange={onToggleShowEmployeesWithoutEntries}
        />
        <Label htmlFor="show-employees-without-entries" className="text-sm text-muted-foreground">
          แสดงพนักงานที่ไม่มีรอบจ่าย
        </Label>
      </div>
    </div>
  )
}
