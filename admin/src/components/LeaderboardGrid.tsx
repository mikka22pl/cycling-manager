import { createColumnHelper, type ColumnDef } from '@tanstack/react-table'
import { DataGrid } from './DataGrid'
import type { LeaderboardEntry } from '../api/client'

const h = createColumnHelper<LeaderboardEntry>()

const rankCell = (rank: number) => {
  const cls =
    rank === 1
      ? 'text-amber-500 font-bold'
      : rank === 2
        ? 'text-gray-400 font-semibold'
        : rank === 3
          ? 'text-amber-700 font-semibold'
          : 'text-gray-400'
  return <span className={`font-mono text-sm tabular-nums ${cls}`}>#{rank}</span>
}

const columns: ColumnDef<LeaderboardEntry, any>[] = [
  h.accessor('rank', {
    header: 'Rank',
    cell: (info) => rankCell(info.getValue()),
    enableSorting: false,
  }),
  h.accessor('name', {
    header: 'Rider',
    cell: (info) => <span className="font-medium text-gray-900">{info.getValue()}</span>,
    enableSorting: false,
  }),
  h.accessor('teamName', {
    header: 'Team',
    cell: (info) => <span className="text-xs text-gray-500">{info.getValue()}</span>,
    enableSorting: false,
  }),
]

type Props = { entries: LeaderboardEntry[]; onRowClick?: (entry: LeaderboardEntry) => void }

export function LeaderboardGrid({ entries, onRowClick }: Props) {
  return (
    <DataGrid
      data={entries}
      columns={columns}
      onRowClick={onRowClick ? (row) => onRowClick(row.original) : undefined}
    />
  )
}
