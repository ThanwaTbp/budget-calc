'use client'

import { useState } from 'react'
import { Plus, UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { usePayrollBoard } from '@/features/payroll/hooks/usePayrollBoard'
import { EmployeeDialog } from '@/features/payroll/ui/EmployeeDialog'
import { PayrollEntryDialog } from '@/features/payroll/ui/PayrollEntryDialog'
import { PayrollOverviewToolbar } from '@/features/payroll/ui/PayrollOverviewToolbar'
import { PayrollPeriodToolbar } from '@/features/payroll/ui/PayrollPeriodToolbar'
import { PayrollPersonalPanel } from '@/features/payroll/ui/PayrollPersonalPanel'
import { PayrollSummaryBar } from '@/features/payroll/ui/PayrollSummaryBar'
import { PayrollTable } from '@/features/payroll/ui/PayrollTable'
import type { PayrollBoardTab } from '@/features/payroll/type'
import type { IEmployee, IPayrollEntry } from '@/types/finance'

export function PayrollPage() {
  const isHydrated = useHydrated()
  const {
    activeTab,
    onActiveTabChange,
    yearOptions,
    yearValue,
    onYearChange,
    monthOptions,
    monthValue,
    onMonthChange,
    monthDisabled,
    dayOptions,
    dayValue,
    onDayChange,
    dayDisabled,
    periodLabel,
    periodSummary,
    employeeRows,
    employeeKeyword,
    onEmployeeKeywordChange,
    showEmployeesWithoutEntries,
    onToggleShowEmployeesWithoutEntries,
    onViewEmployeePersonal,
    avatarToneByEmployeeId,
    employees,
    selectedEmployeeId,
    onSelectEmployee,
    selectedEmployee,
    selectedEmployeeEntries,
    selectedEmployeeSummary,
    hasEmployees,
  } = usePayrollBoard()

  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<IPayrollEntry | null>(null)
  const [defaultEntryEmployeeId, setDefaultEntryEmployeeId] = useState('')

  const onCreateEmployeeClick = () => {
    setEditingEmployee(null)
    setIsEmployeeDialogOpen(true)
  }

  const onEditEmployee = (employee: IEmployee) => {
    setEditingEmployee(employee)
    setIsEmployeeDialogOpen(true)
  }

  const onEmployeeDialogOpenChange = (open: boolean) => {
    setIsEmployeeDialogOpen(open)
    if (!open) setEditingEmployee(null)
  }

  const onCreateEntryClick = () => {
    setEditingEntry(null)
    setDefaultEntryEmployeeId('')
    setIsEntryDialogOpen(true)
  }

  const onCreateEntryForEmployee = (employeeId: string) => {
    setEditingEntry(null)
    setDefaultEntryEmployeeId(employeeId)
    setIsEntryDialogOpen(true)
  }

  // แท็บรายคน: กดปุ่ม 'เพิ่มรอบจ่าย' ให้ตั้งค่าเริ่มต้นเป็นพนักงานที่กำลังเลือกดูอยู่
  const onCreateEntryForSelectedEmployee = () => {
    onCreateEntryForEmployee(selectedEmployeeId ?? '')
  }

  const onEditEntry = (entry: IPayrollEntry) => {
    setEditingEntry(entry)
    setIsEntryDialogOpen(true)
  }

  const onEntryDialogOpenChange = (open: boolean) => {
    setIsEntryDialogOpen(open)
    if (!open) {
      setEditingEntry(null)
      setDefaultEntryEmployeeId('')
    }
  }

  const onResetEmployeeKeyword = () => onEmployeeKeywordChange('')

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ค่าจ้างพนักงาน" description="บันทึกค่าจ้างรายคน ระบบจะลงเป็นรายจ่ายให้อัตโนมัติ">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="lg" onClick={onCreateEmployeeClick}>
            <UserPlus />
            เพิ่มพนักงาน
          </Button>
          {hasEmployees ? (
            <Button size="lg" onClick={onCreateEntryClick}>
              <Plus />
              เพิ่มรอบจ่าย
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button size="lg" disabled>
                    <Plus />
                    เพิ่มรอบจ่าย
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>เพิ่มพนักงานก่อนจึงจะบันทึกรอบจ่ายได้</TooltipContent>
            </Tooltip>
          )}
        </div>
      </PageHeader>

      {hasEmployees ? (
        <>
          <PayrollPeriodToolbar
            yearOptions={yearOptions}
            yearValue={yearValue}
            onYearChange={onYearChange}
            monthOptions={monthOptions}
            monthValue={monthValue}
            onMonthChange={onMonthChange}
            monthDisabled={monthDisabled}
            dayOptions={dayOptions}
            dayValue={dayValue}
            onDayChange={onDayChange}
            dayDisabled={dayDisabled}
          />

          <Tabs value={activeTab} onValueChange={(value) => onActiveTabChange(value as PayrollBoardTab)}>
            <TabsList>
              <TabsTrigger value="overview">ภาพรวมทั้งหมด</TabsTrigger>
              <TabsTrigger value="personal">รายคน</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex flex-col gap-4">
              <PayrollSummaryBar periodSummary={periodSummary} periodLabel={periodLabel} variant="overview" />

              <Card>
                <CardHeader>
                  <PayrollOverviewToolbar
                    employeeKeyword={employeeKeyword}
                    onEmployeeKeywordChange={onEmployeeKeywordChange}
                    showEmployeesWithoutEntries={showEmployeesWithoutEntries}
                    onToggleShowEmployeesWithoutEntries={onToggleShowEmployeesWithoutEntries}
                  />
                </CardHeader>
                <CardContent className="p-0">
                  <PayrollTable
                    employeeRows={employeeRows}
                    periodSummary={periodSummary}
                    hasEmployees={hasEmployees}
                    employeeKeyword={employeeKeyword}
                    avatarToneByEmployeeId={avatarToneByEmployeeId}
                    onResetEmployeeKeyword={onResetEmployeeKeyword}
                    onCreateEmployeeClick={onCreateEmployeeClick}
                    onCreateEntryClick={onCreateEntryClick}
                    onCreateEntryForEmployee={onCreateEntryForEmployee}
                    onEditEmployee={onEditEmployee}
                    onViewEmployeePersonal={onViewEmployeePersonal}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="personal">
              <PayrollPersonalPanel
                employees={employees}
                selectedEmployeeId={selectedEmployeeId}
                onSelectEmployee={onSelectEmployee}
                avatarToneByEmployeeId={avatarToneByEmployeeId}
                selectedEmployee={selectedEmployee}
                selectedEmployeeEntries={selectedEmployeeEntries}
                selectedEmployeeSummary={selectedEmployeeSummary}
                periodLabel={periodLabel}
                onCreateEntryClick={onCreateEntryForSelectedEmployee}
                onEditEntry={onEditEntry}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <EmptyState icon={Users} title="ยังไม่มีพนักงาน" description="เพิ่มพนักงานคนแรกเพื่อเริ่มบันทึกค่าจ้าง">
          <Button onClick={onCreateEmployeeClick}>
            <UserPlus />
            เพิ่มพนักงาน
          </Button>
        </EmptyState>
      )}

      <EmployeeDialog
        open={isEmployeeDialogOpen}
        onOpenChange={onEmployeeDialogOpenChange}
        editingEmployee={editingEmployee}
      />

      <PayrollEntryDialog
        open={isEntryDialogOpen}
        onOpenChange={onEntryDialogOpenChange}
        employees={employees}
        avatarToneByEmployeeId={avatarToneByEmployeeId}
        defaultEmployeeId={defaultEntryEmployeeId}
        editingEntry={editingEntry}
      />
    </div>
  )
}
