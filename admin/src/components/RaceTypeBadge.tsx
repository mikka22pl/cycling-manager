import type { RaceType } from '../api/client'

export function RaceTypeBadge({ type }: { type: RaceType }) {
  const cls =
    type === 'SINGLE'
      ? 'bg-gray-100 text-gray-500'
      : 'bg-blue-50 text-blue-600'
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${cls}`}>{type}</span>
  )
}
