'use client'

import { ArrowLeftRight, Coins, Fuel } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { GoldPanel } from '@/features/market/ui/GoldPanel'
import { OilPanel } from '@/features/market/ui/OilPanel'
import { CurrencyPanel } from '@/features/market/ui/CurrencyPanel'

export function MarketPage() {
  const isHydrated = useHydrated()

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ราคาตลาด" description="ราคาทองคำ น้ำมัน และอัตราแลกเปลี่ยนล่าสุด" />

      {/* แต่ละแท็บโหลดข้อมูลของตัวเองอิสระจากกัน แท็บหนึ่งพังไม่กระทบแท็บอื่น */}
      <Tabs defaultValue="gold">
        <TabsList>
          <TabsTrigger value="gold">
            <Coins /> ทองคำ
          </TabsTrigger>
          <TabsTrigger value="oil">
            <Fuel /> น้ำมัน
          </TabsTrigger>
          <TabsTrigger value="currency">
            <ArrowLeftRight /> อัตราแลกเปลี่ยน
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gold">
          <GoldPanel />
        </TabsContent>

        <TabsContent value="oil">
          <OilPanel />
        </TabsContent>

        <TabsContent value="currency">
          <CurrencyPanel />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        ที่มาข้อมูล: ราคาทองคำและน้ำมันจาก api.chnwt.dev (สมาคมค้าทองคำ / สมาคมผู้ค้าน้ำมัน) · อัตราแลกเปลี่ยนจาก
        European Central Bank ผ่าน frankfurter.app
      </p>
    </div>
  )
}
