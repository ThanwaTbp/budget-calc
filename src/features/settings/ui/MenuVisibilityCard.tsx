'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { IMenuOption } from '@/features/settings/type'
import { cn } from '@/lib/utils'

interface IMenuVisibilityCard {
  menuOptions: IMenuOption[]
  visibleCount: number
  hiddenCount: number
  onToggleMenu: (href: string) => void
  onShowAllMenus: () => void
}

export function MenuVisibilityCard({
  menuOptions,
  visibleCount,
  hiddenCount,
  onToggleMenu,
  onShowAllMenus,
}: IMenuVisibilityCard) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>เมนูแถบด้านข้าง</CardTitle>
        <CardDescription>
          แสดงอยู่ {visibleCount} จาก {menuOptions.length} เมนู
        </CardDescription>
        {hiddenCount > 0 && (
          <CardAction>
            <Button variant="outline" size="sm" onClick={onShowAllMenus}>
              แสดงทุกเมนู
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col">
        {menuOptions.map((menuOption, index) => (
          <div key={menuOption.href}>
            <div
              className={cn(
                'flex items-center justify-between gap-4 py-2.5',
                !menuOption.isVisible && 'opacity-60',
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <menuOption.icon className="size-4.5 text-muted-foreground" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">{menuOption.label}</span>
                  <span className="truncate text-xs text-muted-foreground">{menuOption.href}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {menuOption.isLocked ? (
                  <>
                    <Badge variant="secondary">จำเป็น</Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Switch checked disabled aria-label={`${menuOption.label} เป็นเมนูจำเป็น ซ่อนไม่ได้`} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>เมนูนี้ซ่อนไม่ได้ ไม่งั้นจะกลับมาเปิดเมนูอื่นไม่ได้อีก</TooltipContent>
                    </Tooltip>
                  </>
                ) : (
                  <Switch
                    checked={menuOption.isVisible}
                    onCheckedChange={() => onToggleMenu(menuOption.href)}
                    aria-label={`สลับการแสดงเมนู ${menuOption.label}`}
                  />
                )}
              </div>
            </div>
            {index < menuOptions.length - 1 && <Separator />}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
