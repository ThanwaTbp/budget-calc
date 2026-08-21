import type { Metadata } from 'next'
import { Bai_Jamjuree, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { ConfirmProvider } from '@/components/common/ConfirmProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/ui/AuthProvider'
import { DEFAULT_PALETTE, PALETTE_IDS, PALETTE_STORAGE_KEY } from '@/constants/palettes'
import './globals.css'

const baiJamjuree = Bai_Jamjuree({
  variable: '--font-bai-jamjuree',
  subsets: ['latin', 'thai'],
  weight: ['200', '300', '400', '500', '600', '700'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Budget Calculate — วางแผนการเงินธุรกิจ',
  description: 'คำนวณรายรับรายจ่ายและค่าจ้างพนักงาน พร้อมภาพรวมการเงินในที่เดียว',
}

// สคริปต์นี้ต้องรันก่อนเบราว์เซอร์วาดหน้าจอ เพื่อแปะ data-palette จากค่าที่บันทึกไว้
// ถ้ารอให้ React hydrate ก่อน ผู้ใช้จะเห็นชุดสีเริ่มต้นแวบขึ้นมาก่อนสลับเป็นสีจริง (FOUC)
const paletteBootstrapScript = `
(function () {
  try {
    var stored = window.localStorage.getItem('${PALETTE_STORAGE_KEY}')
    var allowed = ${JSON.stringify(PALETTE_IDS)}
    var palette = '${DEFAULT_PALETTE}'
    if (stored) {
      var parsed = JSON.parse(stored)
      var candidate = parsed && parsed.state && parsed.state.palette
      if (allowed.indexOf(candidate) !== -1) palette = candidate
    }
    document.documentElement.dataset.palette = palette
  } catch (err) {
    document.documentElement.dataset.palette = '${DEFAULT_PALETTE}'
  }
})()
`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      data-palette={DEFAULT_PALETTE}
      className={`${baiJamjuree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: paletteBootstrapScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider delayDuration={200}>
              <ConfirmProvider>
                {children}
                <Toaster position="top-right" richColors duration={2500} />
              </ConfirmProvider>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
