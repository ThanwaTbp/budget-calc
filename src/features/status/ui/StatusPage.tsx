'use client'

import { CircleAlert, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/common/EmptyState'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { useStatusReport } from '@/features/status/hooks/useStatusReport'
import { ServiceStatusCard } from '@/features/status/ui/ServiceStatusCard'
import { StatusSummaryBar } from '@/features/status/ui/StatusSummaryBar'
import type { IServiceHealth } from '@/types/status'

// กลุ่มการ์ดสถานะของหมวดหนึ่ง (ฐานข้อมูล/ข้อมูลภายนอก)
function ServiceStatusGroup({ title, services }: { title: string; services: IServiceHealth[] }) {
  if (services.length === 0) return null

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceStatusCard key={service.id} service={service} />
        ))}
      </div>
    </section>
  )
}

// โครงหน้าตอนกำลังโหลดครั้งแรก ให้หน้าตาใกล้เคียงของจริง (สรุป + การ์ด 2 กลุ่ม)
function StatusContentSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function StatusPage() {
  const isHydrated = useHydrated()
  const { report, isLoading, errorMessage, isAutoRefreshEnabled, onToggleAutoRefresh, onRefresh } = useStatusReport()

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <StatusContentSkeleton />
      </div>
    )
  }

  const databaseServices = report?.services.filter((service) => service.category === 'database') ?? []
  const externalServices = report?.services.filter((service) => service.category === 'external') ?? []

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="สถานะระบบ" description="ตรวจสอบว่าบริการที่แอปใช้งานอยู่ทำงานปกติหรือไม่">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="status-auto-refresh" checked={isAutoRefreshEnabled} onCheckedChange={onToggleAutoRefresh} />
            <Label htmlFor="status-auto-refresh" className="text-sm text-muted-foreground">
              รีเฟรชอัตโนมัติ
            </Label>
          </div>
          <Button size="lg" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw className={isLoading ? 'animate-spin' : ''} />
            ตรวจสอบใหม่
          </Button>
        </div>
      </PageHeader>

      {isLoading && !report && <StatusContentSkeleton />}

      {!isLoading && !report && (
        <EmptyState
          icon={CircleAlert}
          title="ตรวจสอบสถานะไม่สำเร็จ"
          description={errorMessage ?? 'ไม่สามารถโหลดสถานะระบบได้ กรุณาลองใหม่อีกครั้ง'}
        >
          <Button onClick={onRefresh}>ลองใหม่</Button>
        </EmptyState>
      )}

      {report && (
        <>
          <StatusSummaryBar report={report} />
          <ServiceStatusGroup title="ฐานข้อมูล" services={databaseServices} />
          <ServiceStatusGroup title="ข้อมูลภายนอก" services={externalServices} />
        </>
      )}

      <p className="text-xs text-muted-foreground">สถานะนี้ตรวจจากเซิร์ฟเวอร์ของแอป ไม่ใช่จากเครื่องผู้ใช้</p>
    </div>
  )
}
