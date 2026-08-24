'use client'

import { useState } from 'react'
import { Loader, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useWeatherLocationStore } from '@/features/weather/store/useWeatherLocationStore'
import { useLocationSearch } from '@/features/weather/hooks/useLocationSearch'
import type { IWeatherLocation } from '@/types/weather'

// ช่องค้นหาเมือง กดเลือกแล้วเปลี่ยนสถานที่ที่บันทึกไว้ทันที
export function LocationSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const onSelectLocationInStore = useWeatherLocationStore((state) => state.onSelectLocation)
  const { query, results, isLoading, errorMessage, onQueryChange } = useLocationSearch()

  const onSelectResult = (location: IWeatherLocation) => {
    onSelectLocationInStore(location)
    toast.success(`เปลี่ยนสถานที่เป็น ${location.name} แล้ว`)
    setIsOpen(false)
    onQueryChange('')
  }

  const onOpenChange = (nextOpen: boolean) => {
    setIsOpen(nextOpen)
    if (!nextOpen) {
      onQueryChange('')
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 sm:w-64">
          <Search className="size-4 text-muted-foreground" />
          <span className="truncate text-muted-foreground">ค้นหาเมือง...</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80">
        <Input
          autoFocus
          placeholder="พิมพ์ชื่อเมือง เช่น เชียงใหม่"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />

        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader className="size-4 animate-spin" />
              กำลังค้นหา...
            </div>
          )}

          {!isLoading && errorMessage && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">{errorMessage}</p>
          )}

          {!isLoading && !errorMessage && query.trim() !== '' && results.length === 0 && (
            <p className="px-2 py-3 text-center text-sm text-muted-foreground">ไม่พบเมืองที่ค้นหา</p>
          )}

          {!isLoading &&
            results.map((location) => (
              <button
                key={location.id}
                type="button"
                onClick={() => onSelectResult(location)}
                className="flex items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{location.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {[location.admin1, location.country].filter(Boolean).join(', ')}
                  </span>
                </span>
              </button>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
