import Link from 'next/link'
import { Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface IAuthCard {
  title: string
  description: string
  children: ReactNode
  footerText: string
  footerLinkLabel: string
  footerLinkHref: string
}

// การ์ดกลางจอที่ใช้ร่วมกันทุกหน้า auth: โลโก้ + ชื่อแอป + หัวข้อ + คำอธิบาย + children + ลิงก์สลับหน้าท้ายการ์ด
export function AuthCard({ title, description, children, footerText, footerLinkLabel, footerLinkHref }: IAuthCard) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center gap-1 text-center">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Wallet className="size-5.5" />
        </span>
        <p className="mt-2 text-sm font-semibold tracking-tight text-muted-foreground">Budget Calculate</p>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">{children}</CardContent>

      <CardFooter className="justify-center gap-1.5 text-sm text-muted-foreground">
        {footerText}
        <Link href={footerLinkHref} className="font-medium text-primary hover:underline">
          {footerLinkLabel}
        </Link>
      </CardFooter>
    </Card>
  )
}
