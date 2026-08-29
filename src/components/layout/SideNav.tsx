'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_GROUPS, type INavGroup, type INavItem } from '@/constants/navigation'
import { useMenuSettingsStore } from '@/features/settings/store/useMenuSettingsStore'

interface ISideNav {
  onNavigate?: () => void
}

interface ISideNavItem {
  item: INavItem
  isActive: boolean
  onNavigate?: () => void
}

function SideNavItem({ item, isActive, onNavigate }: ISideNavItem) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      <item.icon className="size-4.5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  )
}

interface ISideNavGroup {
  group: INavGroup
  pathname: string
  hiddenMenuHrefs: string[]
  onNavigate?: () => void
}

function SideNavGroup({ group, pathname, hiddenMenuHrefs, onNavigate }: ISideNavGroup) {
  const visibleItems = group.items.filter((navItem) => !hiddenMenuHrefs.includes(navItem.href))
  if (visibleItems.length === 0) return null

  return (
    <div className="flex flex-col gap-1">
      <p className="px-3 pt-1 pb-1.5 text-[0.6875rem] font-semibold tracking-wider text-muted-foreground/70 uppercase">
        {group.label}
      </p>
      {visibleItems.map((navItem) => (
        <SideNavItem
          key={navItem.href}
          item={navItem}
          isActive={pathname === navItem.href}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  )
}

export function SideNav({ onNavigate }: ISideNav) {
  const pathname = usePathname()
  const hiddenMenuHrefs = useMenuSettingsStore((state) => state.hiddenMenuHrefs)
  const mainGroups = NAV_GROUPS.filter((navGroup) => navGroup.placement === 'main')
  const footerGroups = NAV_GROUPS.filter((navGroup) => navGroup.placement === 'footer')

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Link
        href="/"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-4 transition-colors hover:bg-muted/40"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="size-5.5" />
        </span>
        <span className="text-base font-semibold tracking-tight">Budget Calc</span>
      </Link>

      <nav className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-3" aria-label="เมนูหลัก">
        {mainGroups.map((navGroup) => (
          <SideNavGroup
            key={navGroup.id}
            group={navGroup}
            pathname={pathname}
            hiddenMenuHrefs={hiddenMenuHrefs}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-border p-3">
        {footerGroups.map((navGroup) => (
          <SideNavGroup
            key={navGroup.id}
            group={navGroup}
            pathname={pathname}
            hiddenMenuHrefs={hiddenMenuHrefs}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  )
}
