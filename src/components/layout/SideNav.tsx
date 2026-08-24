'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_ITEMS } from '@/constants/navigation'
import { useMenuSettingsStore } from '@/features/settings/store/useMenuSettingsStore'

interface ISideNav {
  onNavigate?: () => void
}

export function SideNav({ onNavigate }: ISideNav) {
  const pathname = usePathname()
  const hiddenMenuHrefs = useMenuSettingsStore((state) => state.hiddenMenuHrefs)

  // เมนูที่ผู้ใช้เลือกซ่อนในหน้าตั้งค่า ยังเข้าถึงได้ทาง URL ตรง แค่ไม่แสดงในแถบเมนู
  const visibleNavItems = NAV_ITEMS.filter((navItem) => !hiddenMenuHrefs.includes(navItem.href))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="size-5.5" />
        </span>
        <span className="text-base font-semibold tracking-tight">Budget Calc</span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-3">
        {visibleNavItems.map((navItem) => {
          const isActive = pathname === navItem.href

          return (
            <Link
              key={navItem.href}
              href={navItem.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <navItem.icon className="size-5 shrink-0" />
              {navItem.label}
            </Link>
          )
        })}
      </nav>

    </div>
  )
}
