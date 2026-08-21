'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { useHydrated } from '@/hooks/useHydrated'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const hasHydrated = useHydrated()

  const onToggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleTheme}
      aria-label="สลับธีมสว่าง/มืด"
    >
      {/* รอ mount ฝั่ง client ก่อนค่อยเลือกไอคอนจริง เพื่อกัน hydration mismatch */}
      {hasHydrated && resolvedTheme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  )
}
