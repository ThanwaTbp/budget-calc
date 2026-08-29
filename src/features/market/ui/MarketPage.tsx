'use client'

import { ArrowLeftRight, ChartNoAxesCombined, Coins, Fuel } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/common/PageHeader'
import { useHydrated } from '@/hooks/useHydrated'
import { GoldPanel } from '@/features/market/ui/GoldPanel'
import { OilPanel } from '@/features/market/ui/OilPanel'
import { CurrencyPanel } from '@/features/market/ui/CurrencyPanel'
import { StockPanel } from '@/features/market/ui/StockPanel'

export function MarketPage() {
  const isHydrated = useHydrated()

  if (!isHydrated) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="ราคาตลาด" description="เปรียบเทียบสินทรัพย์และราคาที่ใช้ตัดสินใจในแต่ละวันได้เร็วขึ้น" />

      {/* แต่ละแท็บโหลดข้อมูลของตัวเองอิสระจากกัน แท็บหนึ่งพังไม่กระทบแท็บอื่น */}
      <Tabs defaultValue="gold" className="gap-5">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 group-data-horizontal/tabs:h-auto sm:w-fit sm:grid-cols-4">
          <TabsTrigger value="gold" className="h-10">
            <Coins /> ทองคำ
          </TabsTrigger>
          <TabsTrigger value="oil" className="h-10">
            <Fuel /> น้ำมัน
          </TabsTrigger>
          <TabsTrigger value="currency" className="h-10">
            <ArrowLeftRight /> ค่าเงิน
          </TabsTrigger>
          <TabsTrigger value="stocks" className="h-10">
            <ChartNoAxesCombined /> หุ้นสหรัฐฯ
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
        <TabsContent value="stocks">
          <StockPanel />
        </TabsContent>
      </Tabs>

      <p className="text-xs leading-relaxed text-muted-foreground">
        ที่มาข้อมูล: ทองคำและน้ำมันจาก api.chnwt.dev · อัตราแลกเปลี่ยนจาก ECB ผ่าน frankfurter.app ·
        หุ้นสหรัฐฯ จาก Financial Modeling Prep
      </p>
    </div>
  )
}
