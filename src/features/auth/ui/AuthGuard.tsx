'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/store/useAuthStore'

interface IAuthGuard {
  children: ReactNode
}

// ครอบหน้าที่ต้องล็อกอินก่อนถึงจะเข้าได้ ถ้ายังไม่ล็อกอินให้เด้งไปหน้า /login
export function AuthGuard({ children }: IAuthGuard) {
  const router = useRouter()
  const status = useAuthStore((state) => state.status)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  if (status !== 'authenticated') {
    return null
  }

  return <>{children}</>
}
