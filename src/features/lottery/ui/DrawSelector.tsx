'use client'

import { CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { IDrawListItem } from '@/features/lottery/type'

interface IDrawSelector {
  draws: IDrawListItem[]
  selectedDrawId: string | null
  isLoading: boolean
  onSelectDraw: (drawId: string) => void
}

// เลือกงวดหวย — งวดแรกของลิสต์คืองวดล่าสุดเสมอ (route handler เรียงใหม่→เก่าให้แล้ว) จึงติดป้าย 'ล่าสุด' ไว้
export function DrawSelector({ draws, selectedDrawId, isLoading, onSelectDraw }: IDrawSelector) {
  const latestDrawId = draws[0]?.id ?? null

  return (
    <Select
      // ใช้สตริงว่างแทน undefined ตอนยังไม่รู้งวด เพื่อให้เป็น controlled component ตลอด
      // ถ้าส่ง undefined ไปก่อนแล้วค่อยมีค่า React จะเตือนว่าเปลี่ยนจาก uncontrolled เป็น controlled กลางคัน
      value={selectedDrawId ?? ''}
      onValueChange={onSelectDraw}
      disabled={isLoading || draws.length === 0}
    >
      <SelectTrigger className="h-11 w-full rounded-xl bg-card shadow-sm sm:w-64" aria-label="เลือกงวดหวย">
        <span className="flex items-center gap-1.5">
          <CalendarDays className="size-4 text-muted-foreground" />
          <SelectValue placeholder={isLoading ? 'กำลังโหลดงวด...' : 'เลือกงวด'} />
        </span>
      </SelectTrigger>
      <SelectContent>
        {draws.map((drawItem) => (
          <SelectItem key={drawItem.id} value={drawItem.id}>
            <span className="flex items-center gap-2">
              {drawItem.label}
              {drawItem.id === latestDrawId && (
                <Badge variant="secondary" className="rounded-full text-[0.65rem]">
                  ล่าสุด
                </Badge>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
