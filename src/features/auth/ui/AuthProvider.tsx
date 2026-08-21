'use client'

import { useEffect, type ReactNode } from 'react'
import { Wallet } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

interface IAuthProvider {
  children: ReactNode
}

// เรียก onRestoreSession ครั้งเดียวตอนแอปเปิด เพื่อเช็คว่ามี session ของ Appwrite ค้างอยู่ในเบราว์เซอร์นี้ไหม
// ระหว่างรอผลจะแสดงหน้าจอโหลดเต็มจอแทนเนื้อหาจริง กันไม่ให้หน้าที่ต้องล็อกอินแวบขึ้นมาก่อนเช็คสถานะเสร็จ
export function AuthProvider({ children }: IAuthProvider) {
  const status = useAuthStore((state) => state.status)
  const onRestoreSession = useAuthStore((state) => state.onRestoreSession)

  useEffect(() => {
    onRestoreSession()
  }, [onRestoreSession])

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh w-full flex-col items-center justify-center gap-4 bg-background px-4">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-6" />
        </span>
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
