'use client'

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
      value={selectedDrawId ?? undefined}
      onValueChange={onSelectDraw}
      disabled={isLoading || draws.length === 0}
    >
      <SelectTrigger className="w-full sm:w-60" aria-label="เลือกงวดหวย">
        <SelectValue placeholder={isLoading ? 'กำลังโหลดงวด...' : 'เลือกงวด'} />
      </SelectTrigger>
      <SelectContent>
        {draws.map((drawItem) => (
          <SelectItem key={drawItem.id} value={drawItem.id}>
            <span className="flex items-center gap-2">
              {drawItem.label}
              {drawItem.id === latestDrawId && (
                <Badge variant="secondary" className="text-[0.65rem]">
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
