'use client'

import { CloudAlert, CloudCheck, CloudOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSyncStore } from '@/features/sync/store/useSyncStore'

// แปลงเวลาซิงก์ล่าสุดเป็นข้อความไทยแบบวันที่ + เวลา เช่น '21 ส.ค. 2569 14:30'
function formatSyncedAtLabel(isoDateTime: string): string {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDateTime))
}

// ป้ายสถานะซิงก์ข้อมูลขึ้น Appwrite บน TopBar — ซ่อนทั้งหมดตอนปิดใช้งาน (ยังไม่ล็อกอิน/ยังไม่ตั้งค่า Appwrite)
export function SyncIndicator() {
  const status = useSyncStore((state) => state.status)
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt)
  const errorMessage = useSyncStore((state) => state.errorMessage)
  const pendingCount = useSyncStore((state) => state.pendingCount)
  const onRetryPending = useSyncStore((state) => state.onRetryPending)

  if (status === 'disabled' || status === 'idle') return null

  if (status === 'syncing') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
        <RefreshCw className="size-3.5 animate-spin" />
        <span className="hidden sm:inline">กำลังซิงก์</span>
      </span>
    )
  }

  if (status === 'synced') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 px-2 text-xs text-income">
            <CloudCheck className="size-3.5" />
            <span className="hidden sm:inline">ซิงก์แล้ว</span>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {lastSyncedAt ? `ซิงก์ล่าสุด ${formatSyncedAtLabel(lastSyncedAt)}` : 'ซิงก์ล่าสุดเมื่อสักครู่'}
        </TooltipContent>
      </Tooltip>
    )
  }

  if (status === 'offline') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 text-xs text-muted-foreground">
        <CloudOff className="size-3.5" />
        <span className="hidden sm:inline">ออฟไลน์{pendingCount > 0 ? ` (${pendingCount} รายการ)` : ''}</span>
      </span>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-xs text-expense hover:text-expense"
          onClick={onRetryPending}
        >
          <CloudAlert className="size-3.5" />
          <span className="hidden sm:inline">ลองซิงก์ใหม่</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{errorMessage ?? 'ซิงก์ข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'}</TooltipContent>
    </Tooltip>
  )
}
