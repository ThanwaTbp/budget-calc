'use client'

import { UserSearch } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { EmptyState } from '@/components/common/EmptyState'
import { PayrollPersonalTable } from '@/features/payroll/ui/PayrollPersonalTable'
import { PayrollPersonalToolbar } from '@/features/payroll/ui/PayrollPersonalToolbar'
import { PayrollSummaryBar } from '@/features/payroll/ui/PayrollSummaryBar'
import type { IPayrollEntryRow, IPayrollPeriodSummary } from '@/features/payroll/type'
import { DEFAULT_AVATAR_TONE_CLASS } from '@/features/payroll/utils/employee'
import type { IEmployee, IPayrollEntry } from '@/types/finance'

interface IPayrollPersonalPanel {
  employees: IEmployee[]
  selectedEmployeeId: string | null
  onSelectEmployee: (employeeId: string) => void
  avatarToneByEmployeeId: Record<string, string>
  selectedEmployee: IEmployee | null
  selectedEmployeeEntries: IPayrollEntryRow[]
  selectedEmployeeSummary: IPayrollPeriodSummary
  periodLabel: string
  onCreateEntryClick: () => void
  onEditEntry: (entry: IPayrollEntry) => void
}

// เนื้อหาแท็บ 'รายคน': เลือกพนักงาน + แถบสรุปยอดของคนนั้น + ตารางรอบจ่ายทั้งหมดในงวดที่เลือก
export function PayrollPersonalPanel({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  avatarToneByEmployeeId,
  selectedEmployee,
  selectedEmployeeEntries,
  selectedEmployeeSummary,
  periodLabel,
  onCreateEntryClick,
  onEditEntry,
}: IPayrollPersonalPanel) {
  return (
    <div className="flex flex-col gap-4">
      <PayrollPersonalToolbar
        employees={employees}
        selectedEmployeeId={selectedEmployeeId}
        onSelectEmployee={onSelectEmployee}
        avatarToneByEmployeeId={avatarToneByEmployeeId}
        onCreateEntryClick={onCreateEntryClick}
      />

      {!selectedEmployee ? (
        <EmptyState
          icon={UserSearch}
          title="เลือกพนักงานก่อน"
          description="เลือกพนักงานจากรายการด้านบนเพื่อดูรอบจ่ายรายคน"
        />
      ) : (
        <>
          <PayrollSummaryBar periodSummary={selectedEmployeeSummary} periodLabel={periodLabel} variant="personal" />
          <Card>
            <CardContent className="p-0">
              <PayrollPersonalTable
                rows={selectedEmployeeEntries}
                periodSummary={selectedEmployeeSummary}
                periodLabel={periodLabel}
                avatarToneClass={avatarToneByEmployeeId[selectedEmployee.id] ?? DEFAULT_AVATAR_TONE_CLASS}
                employeeName={selectedEmployee.name}
                onEditEntry={onEditEntry}
                onCreateEntryClick={onCreateEntryClick}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
