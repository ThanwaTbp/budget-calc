export type FontSizeId = 'sm' | 'md' | 'lg'

export interface IFontSizeOption {
  id: FontSizeId
  label: string
  description: string
  previewClassName: string
}

export const DEFAULT_FONT_SIZE: FontSizeId = 'md'

export const FONT_SIZE_STORAGE_KEY = 'budget-calc:font-size'

export const FONT_SIZE_OPTIONS: IFontSizeOption[] = [
  { id: 'sm', label: 'เล็ก', description: 'SM', previewClassName: 'text-xs' },
  { id: 'md', label: 'ปกติ', description: 'MD', previewClassName: 'text-base' },
  { id: 'lg', label: 'ใหญ่', description: 'LG', previewClassName: 'text-lg' },
]

export const FONT_SIZE_IDS: FontSizeId[] = FONT_SIZE_OPTIONS.map((fontSize) => fontSize.id)
