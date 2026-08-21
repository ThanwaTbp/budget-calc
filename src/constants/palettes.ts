export type PaletteId = 'emerald' | 'indigo' | 'blue' | 'teal'

export interface IPaletteOption {
  id: PaletteId
  name: string
  description: string
  swatchClasses: [string, string, string]
}

export const DEFAULT_PALETTE: PaletteId = 'emerald'

export const PALETTE_STORAGE_KEY = 'budget-calc:palette'

export const PALETTE_OPTIONS: IPaletteOption[] = [
  {
    id: 'emerald',
    name: 'Emerald Finance',
    description: 'เขียวการเงิน โทน zinc สื่อเรื่องเงินและการเติบโต',
    swatchClasses: ['swatch-emerald-primary', 'swatch-emerald-income', 'swatch-emerald-expense'],
  },
  {
    id: 'indigo',
    name: 'Indigo Slate',
    description: 'ม่วงคราม โทน slate ลุค SaaS สมัยใหม่ สะอาดตา',
    swatchClasses: ['swatch-indigo-primary', 'swatch-indigo-income', 'swatch-indigo-expense'],
  },
  {
    id: 'blue',
    name: 'Midnight Blue',
    description: 'น้ำเงินธุรกิจ โทน gray ดูน่าเชื่อถือ เรียบที่สุด',
    swatchClasses: ['swatch-blue-primary', 'swatch-blue-income', 'swatch-blue-expense'],
  },
  {
    id: 'teal',
    name: 'Warm Stone Teal',
    description: 'เขียวน้ำทะเล โทน stone อบอุ่น นุ่มตา',
    swatchClasses: ['swatch-teal-primary', 'swatch-teal-income', 'swatch-teal-expense'],
  },
]

export const PALETTE_IDS: PaletteId[] = PALETTE_OPTIONS.map((palette) => palette.id)
