'use client'

import { useMemo } from 'react'
import { toast } from 'sonner'
import { ALWAYS_VISIBLE_MENU_HREFS, NAV_ITEMS } from '@/constants/navigation'
import { useMenuSettingsStore } from '@/features/settings/store/useMenuSettingsStore'
import type { IMenuOption } from '@/features/settings/type'

// ตรวจว่าเมนูนี้ซ่อนได้หรือไม่ (ยังไม่ได้แก้สถานะจริง แค่คำนวณล่วงหน้า) แยกออกมาเป็นฟังก์ชัน pure เพื่อทดสอบได้ตรงๆ
// ห้ามซ่อนเมนูล็อก (ALWAYS_VISIBLE_MENU_HREFS) และห้ามซ่อนจนไม่เหลือเมนูใช้งาน (ที่ไม่ใช่เมนูล็อก) เลยแม้แต่รายการเดียว
export function canHideMenu(
  href: string,
  hiddenHrefs: string[],
  allItems: Array<{ href: string }>,
): boolean {
  if (ALWAYS_VISIBLE_MENU_HREFS.includes(href)) return false

  const unlockedItems = allItems.filter((item) => !ALWAYS_VISIBLE_MENU_HREFS.includes(item.href))
  const visibleUnlockedCountAfterHide = unlockedItems.filter(
    (item) => item.href !== href && !hiddenHrefs.includes(item.href),
  ).length

  return visibleUnlockedCountAfterHide >= 1
}

export function useMenuSettings() {
  const hiddenMenuHrefs = useMenuSettingsStore((state) => state.hiddenMenuHrefs)
  const onToggleMenuInStore = useMenuSettingsStore((state) => state.onToggleMenu)
  const onShowAllMenusInStore = useMenuSettingsStore((state) => state.onShowAllMenus)

  const menuOptions: IMenuOption[] = useMemo(
    () =>
      NAV_ITEMS.map((navItem) => ({
        href: navItem.href,
        label: navItem.label,
        icon: navItem.icon,
        isVisible: !hiddenMenuHrefs.includes(navItem.href),
        isLocked: ALWAYS_VISIBLE_MENU_HREFS.includes(navItem.href),
      })),
    [hiddenMenuHrefs],
  )

  const visibleCount = menuOptions.filter((menuOption) => menuOption.isVisible).length
  const hiddenCount = menuOptions.length - visibleCount

  const onToggleMenu = (href: string) => {
    const targetMenu = menuOptions.find((menuOption) => menuOption.href === href)
    if (!targetMenu || targetMenu.isLocked) return

    // กำลังจะซ่อนเมนูนี้ ต้องเช็คก่อนว่าจะไม่ทำให้เหลือเมนูใช้งาน 0 รายการ
    if (targetMenu.isVisible && !canHideMenu(href, hiddenMenuHrefs, NAV_ITEMS)) {
      toast.error('ต้องเหลือเมนูใช้งานอย่างน้อย 1 เมนู')
      return
    }

    onToggleMenuInStore(href)
    toast.success(targetMenu.isVisible ? `ซ่อนเมนู ${targetMenu.label} แล้ว` : `แสดงเมนู ${targetMenu.label} แล้ว`)
  }

  const onShowAllMenus = () => {
    onShowAllMenusInStore()
    toast.success('แสดงทุกเมนูแล้ว')
  }

  return {
    menuOptions,
    visibleCount,
    hiddenCount,
    onToggleMenu,
    onShowAllMenus,
  }
}
