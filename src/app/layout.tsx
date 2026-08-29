import type { Metadata } from 'next'
import { Bai_Jamjuree, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { ConfirmProvider } from '@/components/common/ConfirmProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/features/auth/ui/AuthProvider'
import { DEFAULT_PALETTE, PALETTE_IDS, PALETTE_STORAGE_KEY } from '@/constants/palettes'
import { DEFAULT_FONT_SIZE, FONT_SIZE_IDS, FONT_SIZE_STORAGE_KEY } from '@/constants/fontSizes'
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
  description: 'คำนวณรายรับรายจ่าย ค่าจ้างพนักงาน วางแผนงาน และตรวจหวย ในที่เดียว',
}

// สคริปต์นี้ต้องรันก่อนเบราว์เซอร์วาดหน้าจอ เพื่อแปะชุดสีและขนาดตัวอักษรจากค่าที่บันทึกไว้
// ถ้ารอให้ React hydrate ก่อน ผู้ใช้จะเห็นค่าเริ่มต้นแวบขึ้นมาก่อนสลับเป็นค่าจริง (FOUC)
const appearanceBootstrapScript = `
(function () {
  try {
    const storedPalette = window.localStorage.getItem('${PALETTE_STORAGE_KEY}')
    const allowedPalettes = ${JSON.stringify(PALETTE_IDS)}
    let palette = '${DEFAULT_PALETTE}'
    if (storedPalette) {
      const parsedPalette = JSON.parse(storedPalette)
      const paletteCandidate = parsedPalette && parsedPalette.state && parsedPalette.state.palette
      if (allowedPalettes.indexOf(paletteCandidate) !== -1) palette = paletteCandidate
    }
    document.documentElement.dataset.palette = palette
  } catch (err) {
    document.documentElement.dataset.palette = '${DEFAULT_PALETTE}'
  }

  try {
    const storedFontSize = window.localStorage.getItem('${FONT_SIZE_STORAGE_KEY}')
    const allowedFontSizes = ${JSON.stringify(FONT_SIZE_IDS)}
    let fontSize = '${DEFAULT_FONT_SIZE}'
    if (storedFontSize) {
      const parsedFontSize = JSON.parse(storedFontSize)
      const fontSizeCandidate = parsedFontSize && parsedFontSize.state && parsedFontSize.state.fontSize
      if (allowedFontSizes.indexOf(fontSizeCandidate) !== -1) fontSize = fontSizeCandidate
    }
    document.documentElement.dataset.fontSize = fontSize
  } catch (err) {
    document.documentElement.dataset.fontSize = '${DEFAULT_FONT_SIZE}'
  }
})()
`

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      data-palette={DEFAULT_PALETTE}
      data-font-size={DEFAULT_FONT_SIZE}
      className={`${baiJamjuree.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceBootstrapScript }} />
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
