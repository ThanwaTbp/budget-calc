export function getUserInitials(name: string): string {
  const trimmedName = name.trim()
  if (!trimmedName) return '?'

  return trimmedName
    .split(/\s+/)
    .slice(0, 2)
    .map((namePart) => namePart.charAt(0).toUpperCase())
    .join('')
}
