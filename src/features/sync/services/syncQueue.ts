// คิวงานเขียนขึ้น Appwrite แบบ optimistic — store อัปเดต state ทันที แล้วมาเข้าคิวนี้เพื่อยิงขึ้น cloud เบื้องหลัง
// ห้าม import useTransactionStore/usePayrollStore ที่นี่ (กัน circular import) — รับ payload เป็น entity ล้วนจาก store เท่านั้น
import { AppwriteException } from 'appwrite'
import {
  deleteBudget,
  deleteEmployee,
  deleteLotteryTicket,
  deletePayrollEntry,
  deleteRecurringItem,
  deleteTask,
  deleteTransaction,
  pushBudget,
  pushEmployee,
  pushLotteryTicket,
  pushPayrollEntry,
  pushRecurringItem,
  pushTask,
  pushTransaction,
  toThaiSyncErrorMessage,
} from '@/features/sync/services/remoteStore'
import { useSyncStore } from '@/features/sync/store/useSyncStore'
import type { IEmployee, IPayrollEntry, ITransaction } from '@/types/finance'
import type { ITask } from '@/types/planner'
import type { ILotteryTicket } from '@/types/lottery'
import type { IBudget } from '@/types/budget'
import type { IRecurringItem } from '@/types/recurring'

export type SyncEntityKind =
  | 'transaction'
  | 'employee'
  | 'payrollEntry'
  | 'task'
  | 'lotteryTicket'
  | 'budget'
  | 'recurring'
export type SyncActionKind = 'upsert' | 'delete'

interface ITransactionUpsertOperation {
  kind: 'transaction'
  action: 'upsert'
  id: string
  payload: ITransaction
}

interface ITransactionDeleteOperation {
  kind: 'transaction'
  action: 'delete'
  id: string
}

interface IEmployeeUpsertOperation {
  kind: 'employee'
  action: 'upsert'
  id: string
  payload: IEmployee
}

interface IEmployeeDeleteOperation {
  kind: 'employee'
  action: 'delete'
  id: string
}

interface IPayrollEntryUpsertOperation {
  kind: 'payrollEntry'
  action: 'upsert'
  id: string
  payload: IPayrollEntry
}

interface IPayrollEntryDeleteOperation {
  kind: 'payrollEntry'
  action: 'delete'
  id: string
}

interface ITaskUpsertOperation {
  kind: 'task'
  action: 'upsert'
  id: string
  payload: ITask
}

interface ITaskDeleteOperation {
  kind: 'task'
  action: 'delete'
  id: string
}

interface ILotteryTicketUpsertOperation {
  kind: 'lotteryTicket'
  action: 'upsert'
  id: string
  payload: ILotteryTicket
}

interface ILotteryTicketDeleteOperation {
  kind: 'lotteryTicket'
  action: 'delete'
  id: string
}

interface IBudgetUpsertOperation {
  kind: 'budget'
  action: 'upsert'
  id: string
  payload: IBudget
}

interface IBudgetDeleteOperation {
  kind: 'budget'
  action: 'delete'
  id: string
}

interface IRecurringUpsertOperation {
  kind: 'recurring'
  action: 'upsert'
  id: string
  payload: IRecurringItem
}

interface IRecurringDeleteOperation {
  kind: 'recurring'
  action: 'delete'
  id: string
}

export type ISyncOperation =
  | ITransactionUpsertOperation
  | ITransactionDeleteOperation
  | IEmployeeUpsertOperation
  | IEmployeeDeleteOperation
  | IPayrollEntryUpsertOperation
  | IPayrollEntryDeleteOperation
  | ITaskUpsertOperation
  | ITaskDeleteOperation
  | ILotteryTicketUpsertOperation
  | ILotteryTicketDeleteOperation
  | IBudgetUpsertOperation
  | IBudgetDeleteOperation
  | IRecurringUpsertOperation
  | IRecurringDeleteOperation

// ดีเลย์ retry แบบ exponential backoff: 2s, 4s, 8s, ... สูงสุด 30s
const INITIAL_RETRY_DELAY_MS = 2000
const MAX_RETRY_DELAY_MS = 30000

// คิวเก็บงานล่าสุดต่อ id เดียว (key = kind:id) ทำให้ยุบงานซ้ำอัตโนมัติ:
// upsert id เดิมซ้ำหลายครั้งเหลือแค่ครั้งล่าสุด และ delete ที่ตามหลัง upsert จะทับเหลือแค่ delete
const operationQueueMap = new Map<string, ISyncOperation>()

let currentUserId: string | null = null
let isProcessingQueue = false
let retryTimeoutId: ReturnType<typeof setTimeout> | null = null
let currentRetryDelayMs = INITIAL_RETRY_DELAY_MS
let isBrowserOffline = typeof navigator !== 'undefined' ? !navigator.onLine : false

function buildQueueKey(kind: SyncEntityKind, id: string): string {
  return `${kind}:${id}`
}

function reportPendingCount(): void {
  useSyncStore.setState({ pendingCount: operationQueueMap.size })
}

// เบราว์เซอร์/undici โยน TypeError ดิบๆ ตอน fetch หลุดออฟไลน์ ส่วน AppwriteException code 0 คือไม่มี response กลับมาเลย
function isLikelyNetworkFailure(error: unknown): boolean {
  if (error instanceof AppwriteException) return error.code === 0
  return error instanceof TypeError
}

async function processSyncOperation(userId: string, operation: ISyncOperation): Promise<void> {
  switch (operation.kind) {
    case 'transaction':
      if (operation.action === 'upsert') {
        await pushTransaction(userId, operation.payload)
      } else {
        await deleteTransaction(operation.id)
      }
      return
    case 'employee':
      if (operation.action === 'upsert') {
        await pushEmployee(userId, operation.payload)
      } else {
        await deleteEmployee(operation.id)
      }
      return
    case 'payrollEntry':
      if (operation.action === 'upsert') {
        await pushPayrollEntry(userId, operation.payload)
      } else {
        await deletePayrollEntry(operation.id)
      }
      return
    case 'task':
      if (operation.action === 'upsert') {
        await pushTask(userId, operation.payload)
      } else {
        await deleteTask(operation.id)
      }
      return
    case 'lotteryTicket':
      if (operation.action === 'upsert') {
        await pushLotteryTicket(userId, operation.payload)
      } else {
        await deleteLotteryTicket(operation.id)
      }
      return
    case 'budget':
      if (operation.action === 'upsert') {
        await pushBudget(userId, operation.payload)
      } else {
        await deleteBudget(operation.id)
      }
      return
    case 'recurring':
      if (operation.action === 'upsert') {
        await pushRecurringItem(userId, operation.payload)
      } else {
        await deleteRecurringItem(operation.id)
      }
      return
  }
}

// ตั้งเวลาลองใหม่แบบ exponential backoff กันซ้อนกันหลายตัวด้วย retryTimeoutId
function scheduleRetry(): void {
  if (retryTimeoutId) return

  const delay = currentRetryDelayMs
  currentRetryDelayMs = Math.min(delay * 2, MAX_RETRY_DELAY_MS)
  retryTimeoutId = setTimeout(() => {
    retryTimeoutId = null
    void processQueue()
  }, delay)
}

// ประมวลผลทีละงานตามลำดับ ล้มเหลวห้าม rollback state ของ store ให้เก็บงานไว้ในคิวแล้วลองใหม่แทน
async function processQueue(): Promise<void> {
  if (isProcessingQueue) return
  if (operationQueueMap.size === 0) return
  if (!currentUserId) return

  if (isBrowserOffline) {
    useSyncStore.getState().onSetOffline(true)
    return
  }

  isProcessingQueue = true
  useSyncStore.setState({ status: 'syncing' })

  const nextEntry = operationQueueMap.entries().next().value
  if (!nextEntry) {
    isProcessingQueue = false
    return
  }

  const [queueKey, operation] = nextEntry

  try {
    await processSyncOperation(currentUserId, operation)

    // ลบเฉพาะงานที่เพิ่งส่งสำเร็จจริง กันเคสที่มีงานใหม่มาทับ key เดิมระหว่าง request ค้างอยู่
    if (operationQueueMap.get(queueKey) === operation) {
      operationQueueMap.delete(queueKey)
    }
    currentRetryDelayMs = INITIAL_RETRY_DELAY_MS
    reportPendingCount()
    isProcessingQueue = false

    if (operationQueueMap.size === 0) {
      useSyncStore.setState({ status: 'synced', lastSyncedAt: new Date().toISOString(), errorMessage: null })
    } else {
      void processQueue()
    }
  } catch (error) {
    isProcessingQueue = false

    if (isBrowserOffline || isLikelyNetworkFailure(error)) {
      isBrowserOffline = true
      useSyncStore.getState().onSetOffline(true)
    } else {
      useSyncStore.setState({ status: 'error', errorMessage: toThaiSyncErrorMessage(error) })
    }

    scheduleRetry()
  }
}

// เพิ่มงานเข้าคิว — store เรียกหลังอัปเดต state ในหน่วยความจำเสร็จแล้วเสมอ (optimistic update)
export function enqueueSyncOperation(operation: ISyncOperation): void {
  const queueKey = buildQueueKey(operation.kind, operation.id)
  operationQueueMap.set(queueKey, operation)
  reportPendingCount()
  void processQueue()
}

// ผูกคิวเข้ากับผู้ใช้คนปัจจุบัน (null = ออกจากระบบ/โหมด guest ไม่ต้อง sync ขึ้น cloud)
export function setSyncUserId(userId: string | null): void {
  currentUserId = userId
  if (userId) void processQueue()
}

// ยกเลิก backoff เดิมแล้วลองส่งคิวทันที ใช้ตอนผู้ใช้กดลองใหม่ หรือกลับมาออนไลน์
export function retrySyncQueueNow(): void {
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId)
    retryTimeoutId = null
  }
  currentRetryDelayMs = INITIAL_RETRY_DELAY_MS
  void processQueue()
}

// ล้างคิวทั้งหมด ใช้ตอนออกจากระบบ ไม่ให้งานของบัญชีเก่าค้างไปยิงตอนบัญชีใหม่ล็อกอิน
export function clearSyncQueue(): void {
  operationQueueMap.clear()
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId)
    retryTimeoutId = null
  }
  currentRetryDelayMs = INITIAL_RETRY_DELAY_MS
  isProcessingQueue = false
  reportPendingCount()
}

// ฟังสถานะออนไลน์/ออฟไลน์ของเบราว์เซอร์ กลับมาออนไลน์แล้วให้ลองส่งคิวที่ค้างทันที
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isBrowserOffline = false
    useSyncStore.getState().onSetOffline(false)
    retrySyncQueueNow()
  })
  window.addEventListener('offline', () => {
    isBrowserOffline = true
    useSyncStore.getState().onSetOffline(true)
  })
}
