import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { userScopedStorage } from '@/lib/userScopedStorage'
import type { ITask } from '@/types/planner'
import { createId } from '@/utils/id'
import type { ITaskInput } from '@/features/planner/type'
import { enqueueSyncOperation } from '@/features/sync/services/syncQueue'

interface IPlannerStore {
  tasks: ITask[]
  onCreate: (input: ITaskInput) => void
  onUpdate: (id: string, input: ITaskInput) => void
  onDelete: (id: string) => void
  onToggleStatus: (id: string) => void
  onReset: () => void
  // แทนที่ tasks ทั้งหมดด้วยข้อมูลจาก Appwrite แบบเงียบ ห้ามยิงกลับเข้าคิว sync (กันลูปอัปโหลดซ้ำ)
  onReplaceAll: (tasks: ITask[]) => void
}

export const usePlannerStore = create<IPlannerStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      onCreate: (input) => {
        const newTask: ITask = {
          ...input,
          id: createId(),
          status: 'todo',
          createdAt: new Date().toISOString(),
        }

        set((state) => ({ tasks: [...state.tasks, newTask] }))
        enqueueSyncOperation({ kind: 'task', action: 'upsert', id: newTask.id, payload: newTask })
      },

      onUpdate: (id, input) => {
        let updatedTask: ITask | null = null

        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) return task
            updatedTask = { ...task, ...input }
            return updatedTask
          }),
        }))

        if (updatedTask) {
          enqueueSyncOperation({ kind: 'task', action: 'upsert', id, payload: updatedTask })
        }
      },

      onDelete: (id) => {
        set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }))
        enqueueSyncOperation({ kind: 'task', action: 'delete', id })
      },

      // สลับสถานะงานระหว่างค้าง ('todo') กับเสร็จแล้ว ('done')
      onToggleStatus: (id) => {
        const task = get().tasks.find((taskItem) => taskItem.id === id)
        if (!task) return

        const updatedTask: ITask = { ...task, status: task.status === 'todo' ? 'done' : 'todo' }

        set((state) => ({
          tasks: state.tasks.map((taskItem) => (taskItem.id === id ? updatedTask : taskItem)),
        }))
        enqueueSyncOperation({ kind: 'task', action: 'upsert', id, payload: updatedTask })
      },

      onReset: () => set({ tasks: [] }),

      onReplaceAll: (tasks) => set({ tasks }),
    }),
    {
      name: 'budget-calc:planner',
      // แยกพื้นที่เก็บข้อมูลตามบัญชีผู้ใช้ (key จริงคือ '<name>:<userId>')
      storage: userScopedStorage,
      version: 1,
    },
  ),
)
