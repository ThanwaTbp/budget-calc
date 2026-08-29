'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { ThemePanel } from '@/components/layout/ThemePanel'
import { SideNav } from '@/components/layout/SideNav'
import { UserMenu } from '@/features/auth/ui/UserMenu'
import { SyncIndicator } from '@/features/sync/ui/SyncIndicator'
import { HeaderStatus } from '@/components/layout/HeaderStatus'

export function TopBar() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const onCloseMobileNav = () => {
    setIsMobileNavOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/90 px-4 shadow-sm backdrop-blur-md md:px-6 lg:px-8">
      <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="เปิดเมนู"
          onClick={() => setIsMobileNavOpen(true)}
        >
          <Menu />
        </Button>
        <SheetContent side="left" className="w-72 p-0">
          {/* หัวข้อสำหรับ screen reader เท่านั้น เพราะ SideNav มีโลโก้แสดงอยู่แล้ว */}
          <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
          <SideNav onNavigate={onCloseMobileNav} />
        </SheetContent>
      </Sheet>

      <HeaderStatus />

      <SyncIndicator />
      <ThemeToggle />
      <ThemePanel />
      <UserMenu />
    </header>
  )
}
