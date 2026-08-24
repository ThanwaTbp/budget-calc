import { Account, Client } from 'appwrite'

// ค่าคอนฟิกมาจาก env ที่ขึ้นต้นด้วย NEXT_PUBLIC_ เท่านั้น เพราะ SDK ทำงานฝั่ง browser ล้วน
// ต้องอ้างอิงแบบเต็มสตริง ห้ามประกอบชื่อตัวแปรเอง ไม่งั้น Next จะแทนค่าตอน build ไม่ได้
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? 'https://cloud.appwrite.io/v1'
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? ''

// ยังไม่ได้ตั้งค่าโปรเจค Appwrite แอปต้องไม่ล่ม แต่ให้หน้า auth แสดงวิธีตั้งค่าแทน
export const isAppwriteConfigured = projectId.trim().length > 0

export const appwriteClient = new Client().setEndpoint(endpoint).setProject(projectId)

export const appwriteAccount = new Account(appwriteClient)

export const APPWRITE_PROJECT_ID = projectId
