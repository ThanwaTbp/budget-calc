import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // ตัดหน้าภาพรวมออกแล้ว จึงส่งผู้ที่เข้ามาที่รากเว็บไปหน้าหลักที่ใช้งานจริงแทน
  // ใช้ redirect ระดับ config แทนการทำหน้าเปล่าไว้ redirect เอง จะได้ไม่ต้อง render อะไรเลย
  async redirects() {
    return [{ source: '/', destination: '/transactions', permanent: false }]
  },
}

export default nextConfig
