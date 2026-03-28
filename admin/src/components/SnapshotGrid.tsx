import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { DataGrid } from './DataGrid'
import type { CyclistSnapshot, Intent } from '../api/client'

const h = createColumnHelper<CyclistSnapshot>()

const intentBadge = (intent: Intent) => {
  const cls: Record<Intent, string> = {
    SAVE_ENERGY: 'bg-gray-100 text-gray-500',
    FOLLOW_PELOTON: 'bg-blue-50 text-blue-600',
    CHASE: 'bg-amber-50 text-amber-700',
    ATTACK: 'bg-red-50 text-red-600',
    BREAKAWAY: 'bg-orange-50 text-orange-600',
    PROTECT_LEADER: 'bg-purple-50 text-purple-600',
    SPRINT_PREP: 'bg-yellow-50 text-yellow-700',
    SPRINT: 'bg-rose-50 text-rose-600',
  }
  const label = intent.replace(/_/g, ' ').toLowerCase()
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium capitalize ${cls[intent]}`}>
      {label}
    </span>
  )
}

const energyCell = (energy: number) => {
  const color =
    energy > 60 ? 'text-green-600' : energy > 30 ? 'text-amber-600' : 'text-red-500'
  return <span className={`font-mono text-xs tabular-nums ${color}`}>{energy.toFixed(0)}%</span>
}

const columns: ColumnDef<CyclistSnapshot, any>[] = [
  h.accessor('position', {
    header: 'Position',
    cell: (info) => (
      <span className="font-mono text-xs tabular-nums">{info.getValue().toFixed(1)} km</span>
    ),
  }),
  h.accessor('name', {
    header: 'Rider',
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
  }),
  h.accessor('teamName', {
    header: 'Team',
    cell: (info) => <span className="text-xs text-gray-500">{info.getValue()}</span>,
  }),
  h.accessor('speed', {
    header: 'Speed',
    cell: (info) => (
      <span className="font-mono text-xs tabular-nums">{info.getValue().toFixed(1)} km/h</span>
    ),
  }),
  h.accessor('energy', {
    header: 'Energy',
    cell: (info) => energyCell(info.getValue()),
  }),
  h.accessor('intent', {
    header: 'Intent',
    cell: (info) => intentBadge(info.getValue()),
  }),
  h.accessor('groupId', {
    header: 'Group',
    cell: (info) =>
      info.getValue() ? (
        <span className="font-mono text-xs text-gray-500">{info.getValue()}</span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
    enableSorting: false,
  }),
  h.accessor('isDropped', {
    header: 'DNF',
    cell: (info) =>
      info.getValue() ? (
        <span className="text-xs text-red-400 font-medium">DNF</span>
      ) : null,
    enableSorting: false,
  }),
]

type Props = { cyclists: CyclistSnapshot[]; onRowClick?: (cyclist: CyclistSnapshot) => void }

export function SnapshotGrid({ cyclists, onRowClick }: Props) {
  return (
    <DataGrid
      data={cyclists}
      columns={columns}
      initialSorting={[{ id: 'position', desc: true }]}
      onRowClick={onRowClick ? (row) => onRowClick(row.original) : undefined}
    />
  )
}
