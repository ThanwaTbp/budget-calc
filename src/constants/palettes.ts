export type PaletteId = 'indigo' | 'blue'

export interface IPaletteOption {
  id: PaletteId
  name: string
  description: string
  swatchClasses: [string, string, string]
}

export const DEFAULT_PALETTE: PaletteId = 'indigo'

export const PALETTE_STORAGE_KEY = 'budget-calc:palette'

export const PALETTE_OPTIONS: IPaletteOption[] = [
  {
    id: 'indigo',
    name: 'Indigo Slate',
    description: 'ม่วงครามบนพื้นอุ่น ลุค SaaS ที่ชัดเจนและนุ่มตา',
    swatchClasses: ['swatch-indigo-primary', 'swatch-indigo-income', 'swatch-indigo-expense'],
  },
  {
    id: 'blue',
    name: 'Midnight Blue',
    description: 'น้ำเงินธุรกิจบนพื้นอุ่น ดูน่าเชื่อถือและสงบ',
    swatchClasses: ['swatch-blue-primary', 'swatch-blue-income', 'swatch-blue-expense'],
  },
]

export const PALETTE_IDS: PaletteId[] = PALETTE_OPTIONS.map((palette) => palette.id)
