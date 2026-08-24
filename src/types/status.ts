export type ServiceStatus = 'up' | 'degraded' | 'down' | 'unknown'
export type ServiceCategory = 'database' | 'external'

export interface IServiceHealth {
  id: string
  name: string
  category: ServiceCategory
  status: ServiceStatus
  responseTimeMs: number | null
  message: string
  checkedAt: string
}

export interface IStatusReport {
  services: IServiceHealth[]
  checkedAt: string
}
