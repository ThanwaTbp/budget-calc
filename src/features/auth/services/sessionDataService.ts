import { toast } from 'sonner'
import {
  migrateGuestDataToUser,
  resumeStorageWrites,
  setActiveStorageScope,
  suspendStorageWrites,
} from '@/lib/userScopedStorage'
import { useTransactionStore } from '@/features/transactions/store/useTransactionStore'
import { usePayrollStore } from '@/features/payroll/store/usePayrollStore'
import { useSyncStore } from '@/features/sync/store/useSyncStore'
import { clearSyncQueue, setSyncUserId } from '@/features/sync/services/syncQueue'
import { isRemoteReady, pushSnapshot, toThaiSyncErrorMessage } from '@/features/sync/services/remoteStore'
import type { IRemoteSnapshot } from '@/features/sync/services/remoteStore'

// ชื่อ store ทั้งสองที่ผูกกับ storage แยกตามบัญชีผู้ใช้ ต้องตรงกับ `name` ที่ตั้งไว้ใน persist ของแต่ละ store เป๊ะ
const SCOPED_STORE_NAMES = ['budget-calc:transactions', 'budget-calc:payroll']

interface IApplyUserDataScopeOptions {
  // ตั้งเป็น true เฉพาะตอนสมัครสำเร็จหรือล็อกอินครั้งแรก เพื่อย้ายข้อมูลที่บันทึกไว้ตอนยังไม่ล็อกอินมาเป็นของบัญชีนี้
  migrateGuestData?: boolean
}

// สลับพื้นที่ข้อมูล (localStorage) ให้ตรงกับบัญชีที่ล็อกอินอยู่ตอนนี้
// ลำดับต้องเป๊ะตาม SPEC: 1) เปลี่ยน scope ก่อน 2) ล้าง state เดิมในหน่วยความจำ 3) (ถ้ามี) ย้ายข้อมูล guest 4) rehydrate ข้อมูลของ scope ใหม่
// ข้ามขั้นล้าง state ไม่ได้ เพราะถ้าบัญชีใหม่ยังไม่มีข้อมูล rehydrate() จะไม่เขียนทับ ทำให้เห็นข้อมูลของบัญชีก่อนหน้าค้างอยู่
export async function applyUserDataScope(
  userId: string | null,
  options: IApplyUserDataScopeOptions = {},
): Promise<void> {
  setActiveStorageScope(userId)

  // หยุดเขียนลง storage ระหว่างล้าง state ไม่งั้น state ว่างจะถูกเขียนทับข้อมูลจริงของบัญชีที่กำลังสลับไป
  suspendStorageWrites()
  useTransactionStore.getState().onReset()
  usePayrollStore.getState().onReset()
  resumeStorageWrites()

  if (options.migrateGuestData && userId) {
    const hasMigrated = migrateGuestDataToUser(SCOPED_STORE_NAMES, userId)
    if (hasMigrated) {
      toast.info('ย้ายข้อมูลที่บันทึกไว้ก่อนหน้ามาเป็นของบัญชีนี้แล้ว')
    }
  }

  await useTransactionStore.persist.rehydrate()
  await usePayrollStore.persist.rehydrate()

  // จากจุดนี้หน้าจอวาดข้อมูลจาก localStorage cache ได้ทันทีแล้ว ที่เหลือทำต่อแบบ async เบื้องหลัง
  // ผูกคิว sync เข้ากับผู้ใช้คนปัจจุบันก่อนเสมอ (null = ออกจากระบบ/โหมด guest ไม่ต้อง sync ขึ้น cloud)
  setSyncUserId(userId)

  if (!userId) {
    clearSyncQueue()
    useSyncStore.getState().onDisable()
    return
  }

  if (!isRemoteReady()) {
    useSyncStore.getState().onDisable()
    return
  }

  void syncRemoteSnapshotInBackground(userId)
}

// ผสานข้อมูลกับ Appwrite เบื้องหลัง (ไม่บล็อกหน้าจอ):
// - remote ว่างทั้งหมดแต่เครื่องนี้มีข้อมูลอยู่ก่อน -> ถือว่าเป็นการย้ายข้อมูลเดิมขึ้น cloud ครั้งแรก
// - มิฉะนั้น Appwrite คือแหล่งข้อมูลจริง เอามาแทนที่ state ทั้งหมดแบบเงียบ (ไม่ยิงกลับเข้าคิว กันลูปอัปโหลดซ้ำ)
async function syncRemoteSnapshotInBackground(userId: string): Promise<void> {
  const remoteSnapshot = await useSyncStore.getState().onPullAll(userId)
  // ล้มเหลว สถานะ error/ข้อความไทยถูกตั้งไว้แล้วใน onPullAll ใช้ข้อมูลจาก localStorage cache ต่อไปได้ ไม่ต้องทำอะไรต่อ
  if (!remoteSnapshot) return

  const isRemoteEmpty =
    remoteSnapshot.transactions.length === 0 &&
    remoteSnapshot.employees.length === 0 &&
    remoteSnapshot.entries.length === 0

  const localSnapshot: IRemoteSnapshot = {
    transactions: useTransactionStore.getState().transactions,
    employees: usePayrollStore.getState().employees,
    entries: usePayrollStore.getState().entries,
  }
  const hasLocalData =
    localSnapshot.transactions.length > 0 ||
    localSnapshot.employees.length > 0 ||
    localSnapshot.entries.length > 0

  if (isRemoteEmpty && hasLocalData) {
    try {
      await pushSnapshot(userId, localSnapshot)
      toast.success('อัปโหลดข้อมูลขึ้นระบบเรียบร้อยแล้ว')
      useSyncStore.setState({ status: 'synced', lastSyncedAt: new Date().toISOString(), errorMessage: null })
    } catch (error) {
      useSyncStore.setState({ status: 'error', errorMessage: toThaiSyncErrorMessage(error) })
    }
    return
  }

  useTransactionStore.getState().onReplaceAll(remoteSnapshot.transactions)
  usePayrollStore.getState().onReplaceAll({ employees: remoteSnapshot.employees, entries: remoteSnapshot.entries })
}
