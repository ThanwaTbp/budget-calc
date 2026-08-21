import { AlertTriangle } from 'lucide-react'

// แสดงแทนฟอร์มเมื่อยังไม่ได้ตั้งค่าโปรเจค Appwrite (isAppwriteConfigured === false)
// บอกขั้นตอนภาษาไทยให้ผู้ใช้ไปตั้งค่าให้ครบก่อนใช้งานระบบบัญชีผู้ใช้ได้จริง
export function AppwriteSetupNotice() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-warning-muted bg-warning-muted px-4 py-4 text-sm">
      <div className="flex items-center gap-2 font-medium text-warning">
        <AlertTriangle className="size-4 shrink-0" />
        ยังไม่ได้ตั้งค่าระบบบัญชีผู้ใช้
      </div>
      <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
        <li>
          สมัครใช้งานฟรีที่{' '}
          <a
            href="https://cloud.appwrite.io"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-2"
          >
            cloud.appwrite.io
          </a>{' '}
          แล้วสร้างโปรเจคใหม่
        </li>
        <li>
          คัดลอก Project ID มาใส่ในไฟล์ <code className="rounded bg-muted px-1 py-0.5 text-foreground">.env.local</code>{' '}
          ที่ตัวแปร{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">NEXT_PUBLIC_APPWRITE_PROJECT_ID</code>
        </li>
        <li>
          ไปที่เมนู Settings &gt; Platforms เพิ่ม Web platform โดยตั้ง hostname เป็น{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-foreground">localhost</code>
        </li>
        <li>รีสตาร์ทเซิร์ฟเวอร์แล้วรีเฟรชหน้านี้อีกครั้ง</li>
      </ol>
    </div>
  )
}
