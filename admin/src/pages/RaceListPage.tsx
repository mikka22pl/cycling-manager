import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { DataGrid } from "../components/DataGrid";
import { useRaces } from "../hooks/useRaces";
import type { RaceSummary, RaceStatus } from "../api/client";

const h = createColumnHelper<RaceSummary>();

const statusBadge = (status: RaceStatus) => {
  const cls = {
    DRAFT: "bg-gray-100 text-gray-500",
    OPEN: "bg-green-800 text-lime-500",
    PENDING: "bg-gray-100 text-orange-500",
    RUNNING: "bg-amber-50 text-amber-700",
    FINISHED: "bg-green-50 text-green-700",
  }[status];
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${cls}`}>
      {status}
    </span>
  );
};

const columns: ColumnDef<RaceSummary, any>[] = [
  h.accessor("name", {
    header: "Name",
    cell: (info) => (
      <span className="font-medium text-gray-900">{info.getValue()}</span>
    ),
  }),
  h.accessor("status", {
    header: "Status",
    cell: (info) => statusBadge(info.getValue()),
  }),
  h.accessor("totalDistance", {
    header: "Distance",
    cell: (info) => (
      <span className="font-mono text-xs tabular-nums">
        {info.getValue()} km
      </span>
    ),
  }),
  h.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-xs text-gray-500">
        {new Date(info.getValue()).toLocaleString()}
      </span>
    ),
  }),
];

export default function RaceListPage() {
  const { data, isLoading, isError } = useRaces();
  const navigate = useNavigate();

  return (
    <div className="pt-6">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Races</h1>
      </div>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {isError && (
        <p className="text-sm text-red-400">Could not reach the engine API.</p>
      )}
      {data && (
        <DataGrid
          data={data}
          columns={columns}
          onRowClick={(row) => navigate(`/race/${row.original.id}`)}
        />
      )}
    </div>
  );
}
