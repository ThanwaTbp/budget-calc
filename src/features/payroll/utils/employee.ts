// helper เกี่ยวกับข้อมูลพนักงานที่ใช้ร่วมกันหลาย component ในฟีเจอร์ค่าจ้าง

import type { IEmployee } from '@/types/finance'

// ดึงอักษรย่อจากชื่อพนักงานมาแสดงใน Avatar เช่น 'สมชาย ใจดี' -> 'สม'
export function getInitials(name: string): string {
  return name.trim().slice(0, 2)
}

// จำนวนโทนสี Avatar ที่มีให้ใน globals.css (avatar-tone-1 ถึง avatar-tone-6)
const AVATAR_TONE_COUNT = 6

// สีสำรองกรณีหาโทนสีของพนักงานคนนี้ใน avatarToneByEmployeeId ไม่เจอ (ไม่ควรเกิดขึ้นจริง)
export const DEFAULT_AVATAR_TONE_CLASS = 'avatar-tone-1'

// ให้สีตามลำดับของพนักงานในรายการ (คนที่ 1-6 ได้คนละสีแน่นอน เกินจากนั้นวนซ้ำ)
// ไม่ใช้ hash จาก id เพราะ id เป็น UUID ผลลัพธ์จะสุ่มจนสีซ้ำกันได้ตั้งแต่คนที่ 2-3 (birthday problem)
export function getAvatarToneClass(employeeIndex: number): string {
  const toneIndex = (employeeIndex % AVATAR_TONE_COUNT) + 1
  return `avatar-tone-${toneIndex}`
}

// สร้างตารางสี Avatar ของพนักงานทุกคน โดยอิงลำดับใน employees ของ store (ลำดับที่สร้าง) เท่านั้น
// ต้องรับลิสต์เต็มที่ยังไม่ถูกกรอง/เรียงมาคำนวณเสมอ ไม่งั้นสีของพนักงานคนเดิมจะเปลี่ยนไปมา
// เวลาผู้ใช้ค้นหาหรือสลับการเรียงลำดับตาราง
export function buildAvatarToneMap(employees: IEmployee[]): Record<string, string> {
  return employees.reduce<Record<string, string>>((toneMap, employee, index) => {
    toneMap[employee.id] = getAvatarToneClass(index)
    return toneMap
  }, {})
}
