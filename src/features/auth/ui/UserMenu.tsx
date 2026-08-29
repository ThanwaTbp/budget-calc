'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfirm } from '@/components/common/ConfirmProvider'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { getUserInitials } from '@/features/auth/utils/user'

export function UserMenu() {
  const router = useRouter()
  const confirm = useConfirm()
  const user = useAuthStore((state) => state.user)
  const onLogout = useAuthStore((state) => state.onLogout)

  if (!user) return null

  const onRequestLogout = async () => {
    const isConfirmed = await confirm({
      title: 'ออกจากระบบ?',
      description: 'คุณจะต้องเข้าสู่ระบบใหม่อีกครั้งเพื่อใช้งาน',
      confirmLabel: 'ออกจากระบบ',
      tone: 'warning',
    })
    if (!isConfirmed) return

    await onLogout()
    toast.success('ออกจากระบบแล้ว')
    router.replace('/login')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <Avatar size="sm">
            <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{user.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2.5 py-2 font-normal">
          <span className="truncate text-sm font-medium text-foreground">{user.name}</span>
          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRound />
            โปรไฟล์ของฉัน
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRequestLogout}>
          <LogOut />
          ออกจากระบบ
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
