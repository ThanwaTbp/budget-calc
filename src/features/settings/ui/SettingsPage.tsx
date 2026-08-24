'use client'

import { Info } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useMenuSettings } from '@/features/settings/hooks/useMenuSettings'
import { MenuVisibilityCard } from '@/features/settings/ui/MenuVisibilityCard'
import { useHydrated } from '@/hooks/useHydrated'

// รายการข้อมูลแอปแบบอ่านอย่างเดียว อธิบายพฤติกรรมที่ผู้ใช้อาจสงสัยเวลาซ่อนเมนูหรือสลับบัญชี
const APP_INFO_ITEMS = [
  'ข้อมูลถูกซิงก์ขึ้นระบบอัตโนมัติเมื่อล็อกอิน',
  'ธีมและชุดสีปรับได้จากปุ่มบนแถบด้านบน',
  'เมนูที่ซ่อนยังเข้าถึงได้ทาง URL ตรง',
]

export function SettingsPage() {
  const isHydrated = useHydrated()
  const { menuOptions, visibleCount, hiddenCount, onToggleMenu, onShowAllMenus } = useMenuSettings()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ตั้งค่า" description="ปรับแต่งการใช้งานให้เหมาะกับคุณ" />

      {isHydrated ? (
        <MenuVisibilityCard
          menuOptions={menuOptions}
          visibleCount={visibleCount}
          hiddenCount={hiddenCount}
          onToggleMenu={onToggleMenu}
          onShowAllMenus={onShowAllMenus}
        />
      ) : (
        <Skeleton className="h-80 w-full rounded-xl" />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4 text-muted-foreground" />
            ข้อมูลแอป
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {APP_INFO_ITEMS.map((infoItem) => (
              <li key={infoItem} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                <span>{infoItem}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
