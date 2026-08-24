'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

interface IGuestGuard {
  children: ReactNode
}

// หน้าที่ต้องเข้าได้แม้ล็อกอินค้างอยู่: ลิงก์รีเซ็ตรหัสผ่านจากอีเมลมีอายุจำกัด
// ถ้าเตะออกไปเพราะมี session ค้างในเบราว์เซอร์ ผู้ใช้จะตั้งรหัสใหม่ไม่ได้เลยและลิงก์อาจหมดอายุก่อนกลับมากดซ้ำ
const PATHS_ALLOWED_WHILE_AUTHENTICATED = ['/reset-password']

// ครอบหน้าที่ต้องยังไม่ล็อกอินถึงจะเข้าได้ (login/register/...) ถ้าล็อกอินอยู่แล้วให้เด้งกลับหน้าแรก
export function GuestGuard({ children }: IGuestGuard) {
  const router = useRouter()
  const pathname = usePathname()
  const status = useAuthStore((state) => state.status)

  const isAllowedWhileAuthenticated = PATHS_ALLOWED_WHILE_AUTHENTICATED.includes(pathname)
  const shouldRedirect = status === 'authenticated' && !isAllowedWhileAuthenticated

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/transactions')
    }
  }, [shouldRedirect, router])

  if (shouldRedirect) {
    return null
  }

  return <>{children}</>
}
