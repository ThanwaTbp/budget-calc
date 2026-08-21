'use client'

import { Plus } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_AVATAR_TONE_CLASS, getInitials } from '@/features/payroll/utils/employee'
import type { IEmployee } from '@/types/finance'
import { cn } from '@/lib/utils'

interface IPayrollPersonalToolbar {
  employees: IEmployee[]
  selectedEmployeeId: string | null
  onSelectEmployee: (employeeId: string) => void
  avatarToneByEmployeeId: Record<string, string>
  onCreateEntryClick: () => void
}

// แถบเลือกพนักงานของแท็บรายคน แสดง Avatar อักษรย่อ + ชื่อ
// พร้อมปุ่มเพิ่มรอบจ่ายให้คนที่กำลังเลือกอยู่โดยตรง
export function PayrollPersonalToolbar({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  avatarToneByEmployeeId,
  onCreateEntryClick,
}: IPayrollPersonalToolbar) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select value={selectedEmployeeId ?? ''} onValueChange={onSelectEmployee}>
        <SelectTrigger className="w-full sm:w-72">
          <SelectValue placeholder="เลือกพนักงาน" />
        </SelectTrigger>
        <SelectContent>
          {employees.map((employee) => (
            <SelectItem key={employee.id} value={employee.id}>
              <Avatar size="sm">
                <AvatarFallback
                  className={cn(
                    avatarToneByEmployeeId[employee.id] ?? DEFAULT_AVATAR_TONE_CLASS,
                    'text-xs font-semibold',
                  )}
                >
                  {getInitials(employee.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-base font-semibold text-foreground">{employee.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={onCreateEntryClick} disabled={!selectedEmployeeId}>
        <Plus />
        เพิ่มรอบจ่าย
      </Button>
    </div>
  )
}
