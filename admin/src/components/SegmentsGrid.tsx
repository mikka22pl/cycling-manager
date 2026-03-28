import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { DataGrid } from './DataGrid'
import type { Segment, SegmentType, WindDirection } from '../api/client'

const h = createColumnHelper<Segment>()

const typeChip = (type: SegmentType) => {
  const cls = {
    flat: 'bg-blue-50 text-blue-700',
    climb: 'bg-orange-50 text-orange-700',
    descent: 'bg-teal-50 text-teal-700',
  }[type]
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${cls}`}>{type}</span>
  )
}

const windLabel = (dir?: WindDirection) => {
  if (!dir) return <span className="text-gray-300">—</span>
  return { head: 'headwind', tail: 'tailwind', cross: 'crosswind' }[dir]
}

const columns: ColumnDef<Segment, any>[] = [
  h.display({
    id: 'index',
    header: '#',
    cell: (info) => (
      <span className="text-gray-400 font-mono text-xs">{info.row.index + 1}</span>
    ),
    enableSorting: false,
  }),
  h.accessor('startKm', {
    header: 'Start',
    cell: (info) => <span className="font-mono text-xs">{info.getValue()} km</span>,
  }),
  h.accessor('endKm', {
    header: 'End',
    cell: (info) => <span className="font-mono text-xs">{info.getValue()} km</span>,
  }),
  h.display({
    id: 'length',
    header: 'Length',
    cell: (info) => (
      <span className="font-mono text-xs text-gray-500">
        {info.row.original.endKm - info.row.original.startKm} km
      </span>
    ),
    enableSorting: false,
  }),
  h.accessor('type', {
    header: 'Type',
    cell: (info) => typeChip(info.getValue()),
  }),
  h.accessor('gradient', {
    header: 'Gradient',
    cell: (info) => (
      <span className="font-mono text-xs">
        {info.getValue() > 0 ? '+' : ''}
        {info.getValue()}%
      </span>
    ),
  }),
  h.accessor('windDirection', {
    header: 'Wind',
    cell: (info) => <span className="text-xs">{windLabel(info.getValue())}</span>,
    enableSorting: false,
  }),
  h.accessor('windStrength', {
    header: 'Strength',
    cell: (info) =>
      info.getValue() != null ? (
        <span className="font-mono text-xs">{info.getValue()}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
    enableSorting: false,
  }),
]

type Props = { segments: Segment[] }

export function SegmentsGrid({ segments }: Props) {
  const sorted = [...segments].sort((a, b) => a.startKm - b.startKm)
  return <DataGrid data={sorted} columns={columns} />
}
