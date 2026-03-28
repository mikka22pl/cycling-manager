import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { DataGrid } from "../components/DataGrid";
import { useSeasons } from "../hooks/useSeasons";
import { useCreateSeason } from "../hooks/useCreateSeason";
import type { SeasonSummary } from "../api/client";

const h = createColumnHelper<SeasonSummary>();

const columns: ColumnDef<SeasonSummary, any>[] = [
  h.accessor("year", {
    header: "Year",
    cell: (info) => (
      <span className="font-semibold text-gray-900 font-mono">
        {info.getValue()}
      </span>
    ),
  }),
  h.accessor("raceCount", {
    header: "Races",
    cell: (info) => (
      <span className="font-mono text-xs tabular-nums text-gray-600">
        {info.getValue()}
      </span>
    ),
  }),
  h.accessor("createdAt", {
    header: "Created",
    cell: (info) => (
      <span className="text-xs text-gray-500">
        {new Date(info.getValue()).toLocaleDateString()}
      </span>
    ),
  }),
];

export default function SeasonListPage() {
  const { data, isLoading, isError } = useSeasons();
  const navigate = useNavigate();
  const {
    mutate: createSeason,
    isPending,
    error: createError,
  } = useCreateSeason();

  const [year, setYear] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = parseInt(year, 10);
    if (!yearNum || yearNum < 1919 || yearNum > 2100) return;
    createSeason({ year: yearNum }, { onSuccess: () => setYear("") });
  };

  return (
    <div className="pt-6">
      <div className="mb-8 flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900">Seasons</h1>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year (e.g. 2025)"
            min={1920}
            max={2100}
            className="w-36 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
          >
            {isPending ? "Creating…" : "New Season"}
          </button>
        </form>
      </div>

      {createError && (
        <p className="text-sm text-red-500 mb-4">{createError.message}</p>
      )}

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}
      {isError && (
        <p className="text-sm text-red-400">Could not reach the engine API.</p>
      )}
      {data && (
        <DataGrid
          data={data}
          columns={columns}
          onRowClick={(row) => navigate(`/seasons/${row.original.id}`)}
        />
      )}
    </div>
  );
}
