'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Check, Laptop, Moon, Palette, Sun, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useHydrated } from '@/hooks/useHydrated'
import { usePaletteStore } from '@/stores/usePaletteStore'
import { PALETTE_OPTIONS, type PaletteId } from '@/constants/palettes'

interface IThemeModeOption {
  value: string
  label: string
  icon: LucideIcon
}

const THEME_MODE_OPTIONS: IThemeModeOption[] = [
  { value: 'light', label: 'สว่าง', icon: Sun },
  { value: 'dark', label: 'มืด', icon: Moon },
  { value: 'system', label: 'ตามระบบ', icon: Laptop },
]

export function ThemePanel() {
  const [isOpen, setIsOpen] = useState(false)
  const hasHydrated = useHydrated()
  const { theme, setTheme } = useTheme()
  const palette = usePaletteStore((state) => state.palette)
  const onSelectPalette = usePaletteStore((state) => state.onSelectPalette)

  const activeMode = hasHydrated ? (theme ?? 'system') : 'system'

  const onChangePalette = (nextPalette: PaletteId) => {
    onSelectPalette(nextPalette)
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="เลือกธีมและชุดสี"
        onClick={() => setIsOpen(true)}
      >
        <Palette />
      </Button>

      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>ธีมและชุดสี</SheetTitle>
          <SheetDescription>ปรับหน้าตาแอปได้ตามชอบ ระบบจะจำค่าไว้ในเบราว์เซอร์นี้</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">โหมดแสง</h3>
            <div className="grid grid-cols-3 gap-2">
              {THEME_MODE_OPTIONS.map((modeOption) => {
                const isActive = activeMode === modeOption.value

                return (
                  <button
                    key={modeOption.value}
                    type="button"
                    onClick={() => setTheme(modeOption.value)}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg border px-3 py-3 text-xs transition-colors',
                      isActive
                        ? 'border-primary bg-accent text-accent-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <modeOption.icon className="size-4" />
                    {modeOption.label}
                  </button>
                )
              })}
            </div>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-medium">ชุดสี</h3>
              <p className="text-xs text-muted-foreground">
                แต่ละชุดปรับทั้งสีหลัก สีรายรับ-รายจ่าย และสีกราฟให้เข้ากันทั้งระบบ
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {PALETTE_OPTIONS.map((paletteOption) => {
                const isActive = hasHydrated && palette === paletteOption.id

                return (
                  <button
                    key={paletteOption.id}
                    type="button"
                    onClick={() => onChangePalette(paletteOption.id)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors',
                      isActive
                        ? 'border-primary bg-accent/60'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    <span className="flex shrink-0 items-center -space-x-1.5">
                      {paletteOption.swatchClasses.map((swatchClass) => (
                        <span
                          key={swatchClass}
                          className={cn(
                            'size-5 rounded-full border-2 border-card',
                            swatchClass,
                          )}
                        />
                      ))}
                    </span>

                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{paletteOption.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {paletteOption.description}
                      </span>
                    </span>

                    {isActive ? <Check className="size-4 shrink-0 text-primary" /> : null}
                  </button>
                )
              })}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
