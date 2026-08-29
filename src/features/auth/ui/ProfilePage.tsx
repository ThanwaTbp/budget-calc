'use client'

import { BadgeCheck, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/common/PageHeader'
import { ProfileNameForm } from '@/features/auth/ui/ProfileNameForm'
import { ProfilePasswordForm } from '@/features/auth/ui/ProfilePasswordForm'
import { useAuthStore } from '@/features/auth/store/useAuthStore'
import { getUserInitials } from '@/features/auth/utils/user'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  if (!user) return null

  return (
    <div className="flex max-w-6xl flex-col gap-6">
      <PageHeader title="โปรไฟล์ของฉัน" description="จัดการชื่อที่แสดงและความปลอดภัยของบัญชี" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Card className="lg:sticky lg:top-22">
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 text-lg">
                <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm">
              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <p className="font-medium">ข้อมูลบัญชี</p>
                  <p className="text-muted-foreground">ชื่อแก้ไขได้และอัปเดตทันทีทั้งแอป</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                {user.isEmailVerified ? (
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-income" />
                ) : (
                  <Mail className="mt-0.5 size-4 shrink-0 text-warning" />
                )}
                <div>
                  <p className="font-medium">{user.isEmailVerified ? 'ยืนยันอีเมลแล้ว' : 'ยังไม่ได้ยืนยันอีเมล'}</p>
                  <p className="text-muted-foreground">อีเมลเป็นตัวระบุบัญชีและไม่อนุญาตให้เปลี่ยน</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลส่วนตัว</CardTitle>
              <CardDescription>แก้ชื่อที่เพื่อนร่วมทีมจะเห็นในระบบ</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <ProfileNameForm />

              <div className="flex flex-col gap-1.5 border-t border-border pt-5">
                <Label htmlFor="profile-email" className="flex items-center gap-2">
                  อีเมล
                  <LockKeyhole className="size-3.5 text-muted-foreground" />
                </Label>
                <Input id="profile-email" type="email" value={user.email} readOnly aria-readonly />
                <p className="text-sm text-muted-foreground">อีเมลไม่สามารถเปลี่ยนได้เพื่อรักษาการเชื่อมโยงข้อมูลบัญชี</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" />
                ความปลอดภัย
              </CardTitle>
              <CardDescription>เปลี่ยนรหัสผ่านโดยยืนยันรหัสปัจจุบันก่อนเสมอ</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfilePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
