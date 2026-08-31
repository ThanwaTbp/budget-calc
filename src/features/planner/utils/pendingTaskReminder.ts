import type { ITask } from '@/types/planner'

// งานที่ต้องเตือนคือยังไม่เสร็จและวันที่นัดหมายมาถึงแล้ว รวมงานเก่าที่ยังค้างอยู่ด้วย
export function getPendingTasksDueByDate(tasks: ITask[], todayDate: string): ITask[] {
  return tasks
    .filter((task) => task.status === 'todo' && task.date <= todayDate)
    .sort((firstTask, secondTask) => {
      const dateComparison = firstTask.date.localeCompare(secondTask.date)
      if (dateComparison !== 0) return dateComparison

      if (firstTask.startTime === secondTask.startTime) {
        return firstTask.createdAt.localeCompare(secondTask.createdAt)
      }
      if (!firstTask.startTime) return 1
      if (!secondTask.startTime) return -1
      return firstTask.startTime.localeCompare(secondTask.startTime)
    })
}
