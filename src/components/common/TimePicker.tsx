'use client'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ITimePicker {
  value: string
  onChange: (nextTime: string) => void
  id?: string
  className?: string
  disabled?: boolean
}

// ใช้ช่องเวลาของเบราว์เซอร์ตรงๆ เพราะเป็นสิ่งที่ผู้ใช้คุ้นเคยที่สุด
// กดครั้งเดียวได้ตัวเลือกเวลาของระบบ (บนมือถือคือวงล้อเลื่อนที่ใช้ง่ายอยู่แล้ว) และพิมพ์เองก็ได้
// ค่าที่ได้เป็น 'HH:mm' หรือค่าว่างเมื่อผู้ใช้ล้างช่อง ตรงกับที่ฟอร์มต้องการพอดี
export function TimePicker({ value, onChange, id, className, disabled }: ITimePicker) {
  return (
    <Input
      id={id}
      type="time"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={cn('tabular h-10 text-base', className)}
    />
  )
}
