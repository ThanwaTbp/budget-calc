'use client'

import Link from 'next/link'
import { ArrowRight, Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/common/EmptyState'
import type { ITopEmployeeRow } from '@/features/dashboard/hooks/useDashboardData'
import { formatCurrency, formatNumber } from '@/utils/format'

interface ITopEmployees {
  employees: ITopEmployeeRow[]
}

// ดึงอักษรย่อจากชื่อพนักงานสูงสุด 2 ตัวอักษร ใช้แสดงใน Avatar
function getInitials(name: string): string {
  const nameWords = name.trim().split(/\s+/)
  const initials = nameWords.slice(0, 2).map((word) => word.charAt(0).toUpperCase())
  return initials.join('') || '?'
}

export function TopEmployees({ employees }: ITopEmployees) {
  // ใช้ยอดสุทธิรวมสูงสุดในลิสต์เป็นฐานเทียบสัดส่วนของ progress bar แต่ละคน
  const highestTotalNetPay = employees[0]?.totalNetPay ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>ต้นทุนพนักงานสูงสุด</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/payroll">
              ดูทั้งหมด
              <ArrowRight />
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {employees.length === 0 ? (
          <EmptyState
            icon={Users}
            title="ยังไม่มีพนักงาน"
            description="เพิ่มพนักงานและสร้างรอบจ่ายเพื่อดูอันดับต้นทุนพนักงานสูงสุดที่นี่"
          >
            <Button size="sm" asChild>
              <Link href="/payroll">เพิ่มพนักงาน</Link>
            </Button>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {employees.map((employee) => {
              const payRatio = highestTotalNetPay === 0 ? 0 : (employee.totalNetPay / highestTotalNetPay) * 100

              return (
                <li key={employee.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-base font-medium">{employee.name}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {formatNumber(employee.entryCount)} รอบจ่าย
                        </span>
                      </div>
                    </div>
                    <span className="tabular shrink-0 text-base font-semibold">
                      {formatCurrency(employee.totalNetPay)}
                    </span>
                  </div>
                  <Progress value={payRatio} className="h-2" />
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
