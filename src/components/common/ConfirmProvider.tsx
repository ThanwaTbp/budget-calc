'use client'

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, HelpCircle, Trash2, type LucideIcon } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export type ConfirmTone = 'default' | 'danger' | 'warning'

export interface IConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmTone
  icon?: LucideIcon
}

type ConfirmFn = (options: IConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

// ไอคอนและสีของกล่องยืนยันแยกตามระดับความรุนแรงของการกระทำ
const toneIconMap: Record<ConfirmTone, LucideIcon> = {
  default: HelpCircle,
  danger: Trash2,
  warning: AlertTriangle,
}

const toneMediaClassMap: Record<ConfirmTone, string> = {
  default: 'bg-accent text-accent-foreground',
  danger: 'bg-expense-muted text-expense',
  warning: 'bg-warning-muted text-warning',
}

const toneActionClassMap: Record<ConfirmTone, string> = {
  default: '',
  danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<IConfirmOptions | null>(null)
  const resolverRef = useRef<((confirmed: boolean) => void) | null>(null)

  // คืน Promise<boolean> เพื่อให้ผู้เรียกใช้เขียนแบบ await ได้ตรงจุดที่กดปุ่ม
  const onConfirmRequest = useCallback<ConfirmFn>((nextOptions) => {
    setOptions(nextOptions)
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve
    })
  }, [])

  // ปิดกล่องแล้วต้อง resolve เสมอ ไม่งั้น Promise ฝั่งผู้เรียกจะค้าง
  const onSettle = useCallback((confirmed: boolean) => {
    resolverRef.current?.(confirmed)
    resolverRef.current = null
    setOptions(null)
  }, [])

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onSettle(false)
    },
    [onSettle],
  )

  const tone = options?.tone ?? 'default'
  const MediaIcon = options?.icon ?? toneIconMap[tone]

  const contextValue = useMemo(() => onConfirmRequest, [onConfirmRequest])

  return (
    <ConfirmContext.Provider value={contextValue}>
      {children}

      <AlertDialog open={options !== null} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className={toneMediaClassMap[tone]}>
              <MediaIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>{options?.title ?? ''}</AlertDialogTitle>
            {options?.description ? (
              <AlertDialogDescription>{options.description}</AlertDialogDescription>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onSettle(false)}>
              {options?.cancelLabel ?? 'ยกเลิก'}
            </AlertDialogCancel>
            <AlertDialogAction
              className={cn(toneActionClassMap[tone])}
              onClick={() => onSettle(true)}
            >
              {options?.confirmLabel ?? 'ยืนยัน'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  )
}

// เรียกใช้: const confirm = useConfirm() แล้ว if (!(await confirm({ ... }))) return
export function useConfirm(): ConfirmFn {
  const confirmFn = useContext(ConfirmContext)

  if (!confirmFn) {
    throw new Error('useConfirm ต้องใช้ภายใน ConfirmProvider เท่านั้น')
  }

  return confirmFn
}
