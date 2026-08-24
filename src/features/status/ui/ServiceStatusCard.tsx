import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStatusStyle } from '@/features/status/utils/statusStyle'
import { formatNumber } from '@/utils/format'
import type { IServiceHealth } from '@/types/status'

interface IServiceStatusCard {
  service: IServiceHealth
}

// การ์ดแสดงสถานะของบริการหนึ่งเส้น: ไอคอนสถานะ + ชื่อไทย + Badge สถานะ + เวลาตอบสนอง + ข้อความอธิบาย
export function ServiceStatusCard({ service }: IServiceStatusCard) {
  const statusStyle = getStatusStyle(service.status)
  const StatusIcon = statusStyle.icon

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className={`size-4 shrink-0 ${statusStyle.colorClassName}`} />
            {service.name}
          </CardTitle>
          <Badge variant="outline" className={statusStyle.colorClassName}>
            {statusStyle.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">เวลาตอบสนอง</span>
          <span className="tabular font-medium">
            {service.responseTimeMs === null ? '—' : `${formatNumber(service.responseTimeMs)} ms`}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{service.message}</p>
      </CardContent>
    </Card>
  )
}
