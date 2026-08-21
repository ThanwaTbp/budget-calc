import type { ReactNode } from 'react'
import { SideNav } from '@/components/layout/SideNav'
import { TopBar } from '@/components/layout/TopBar'

interface IAppShell {
  children: ReactNode
}

export function AppShell({ children }: IAppShell) {
  return (
    <div className="flex min-h-svh w-full">
      {/* sidebar ยึดติดขอบซ้ายเต็มความสูงจอ ไม่เลื่อนหายไปตามเนื้อหา */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <SideNav />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <TopBar />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
