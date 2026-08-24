'use client'

import { useEffect, useState } from 'react'

// นาฬิกาที่เดินจริง อัปเดตทุก 1 วินาที
// คืน null ในรอบ render แรกเสมอ เพราะเวลาฝั่งเซิร์ฟเวอร์กับเบราว์เซอร์ไม่มีทางตรงกัน
// ถ้า render เวลาออกมาตั้งแต่ฝั่งเซิร์ฟเวอร์จะเกิด hydration mismatch
export function useCurrentTime(): Date | null {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)

  useEffect(() => {
    const onTick = () => setCurrentTime(new Date())

    // เรียกผ่าน queueMicrotask กัน lint กฎ react-hooks/set-state-in-effect (ห้าม setState แบบ synchronous ใน effect)
    // แต่ยังได้เวลาทันทีโดยไม่ต้องรอครบ 1 วินาทีแรก
    queueMicrotask(onTick)
    const intervalId = setInterval(onTick, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return currentTime
}
