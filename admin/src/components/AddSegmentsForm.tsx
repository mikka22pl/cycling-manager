import { useState } from 'react'
import { useAddSegments } from '../hooks/useAddSegments'
import type { SegmentInput, SegmentType } from '../api/client'

type SegmentRow = {
  distance: string
  type: SegmentType
  gradient: string
}

const emptyRow = (): SegmentRow => ({ distance: '', type: 'flat', gradient: '0' })

type Props = {
  raceId: string
  currentEndKm: number
}

export function AddSegmentsForm({ raceId, currentEndKm }: Props) {
  const [rows, setRows] = useState<SegmentRow[]>([emptyRow()])
  const { mutate, isPending, error } = useAddSegments(raceId)

  const updateRow = (i: number, patch: Partial<SegmentRow>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const addRow = () => setRows((prev) => [...prev, emptyRow()])

  const removeRow = (i: number) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const segments: SegmentInput[] = rows.map((r) => ({
      distance: parseFloat(r.distance),
      type: r.type,
      gradient: parseFloat(r.gradient),
    }))
    if (segments.some((s) => isNaN(s.distance) || s.distance <= 0)) return
    mutate(segments, { onSuccess: () => setRows([emptyRow()]) })
  }

  // Preview cumulative km markers
  let cursor = currentEndKm
  const previews = rows.map((r) => {
    const d = parseFloat(r.distance)
    const start = cursor
    const end = isNaN(d) || d <= 0 ? null : cursor + d
    if (end !== null) cursor = end
    return { start, end }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-gray-400 uppercase tracking-wide">
              <th className="pb-2 pr-3 font-medium w-6">#</th>
              <th className="pb-2 pr-3 font-medium">Distance (km)</th>
              <th className="pb-2 pr-3 font-medium">Type</th>
              <th className="pb-2 pr-3 font-medium">Gradient (%)</th>
              <th className="pb-2 pr-3 font-medium text-gray-300">Start → End</th>
              <th className="pb-2 w-6" />
            </tr>
          </thead>
          <tbody className="space-y-1">
            {rows.map((row, i) => (
              <tr key={i} className="align-middle">
                <td className="pr-3 py-1 text-gray-400 font-mono text-xs">{i + 1}</td>
                <td className="pr-3 py-1">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={row.distance}
                    onChange={(e) => updateRow(i, { distance: e.target.value })}
                    placeholder="e.g. 40"
                    required
                    className="w-28 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono"
                  />
                </td>
                <td className="pr-3 py-1">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(i, { type: e.target.value as SegmentType })}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400"
                  >
                    <option value="flat">flat</option>
                    <option value="climb">climb</option>
                    <option value="descent">descent</option>
                  </select>
                </td>
                <td className="pr-3 py-1">
                  <input
                    type="number"
                    step="0.1"
                    value={row.gradient}
                    onChange={(e) => updateRow(i, { gradient: e.target.value })}
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-gray-400 font-mono"
                  />
                </td>
                <td className="pr-3 py-1 text-xs text-gray-400 font-mono whitespace-nowrap">
                  {previews[i].end !== null
                    ? `${previews[i].start} → ${previews[i].end} km`
                    : `${previews[i].start} → ?`}
                </td>
                <td className="py-1">
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-gray-300 hover:text-red-400 text-sm leading-none px-1"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addRow}
        className="text-xs text-gray-500 hover:text-gray-800 underline"
      >
        + Add segment
      </button>

      {error && <p className="text-sm text-red-500">{error.message}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          {isPending ? 'Saving…' : 'Add segments'}
        </button>
      </div>
    </form>
  )
}
