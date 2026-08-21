'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

interface IGuestGuard {
  children: ReactNode
}

// ครอบหน้าที่ต้องยังไม่ล็อกอินถึงจะเข้าได้ (login/register/...) ถ้าล็อกอินอยู่แล้วให้เด้งกลับหน้าแรก
export function GuestGuard({ children }: IGuestGuard) {
  const router = useRouter()
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/')
    }
  }, [status, router])

  if (status === 'authenticated') {
    return null
  }

  return <>{children}</>
}
