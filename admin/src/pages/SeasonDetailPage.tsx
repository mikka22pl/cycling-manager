import { useState } from "react";
import { createColumnHelper, type ColumnDef } from "@tanstack/react-table";
import { Link, useParams, useNavigate } from "react-router";
import { DataGrid } from "../components/DataGrid";
import { RaceTypeBadge } from "../components/RaceTypeBadge";
import { CreateRaceModal } from "../components/CreateRaceModal";
import { useSeason } from "../hooks/useSeason";
import type { SeasonRace, RaceStatus } from "../api/client";

const h = createColumnHelper<SeasonRace>();

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

const columns: ColumnDef<SeasonRace, any>[] = [
  h.accessor("name", {
    header: "Race",
    cell: (info) => {
      const race = info.row.original;
      const label = race.raceGroupName
        ? `${race.raceGroupName} — Stage ${race.stageNumber}: ${race.name}`
        : race.name;
      return <span className="font-medium text-gray-900">{label}</span>;
    },
  }),
  h.accessor("raceType", {
    header: "Type",
    cell: (info) => <RaceTypeBadge type={info.getValue()} />,
  }),
  h.accessor("stageNumber", {
    header: "Stage",
    cell: (info) =>
      info.getValue() != null ? (
        <span className="font-mono text-xs tabular-nums text-gray-500">
          {info.getValue()}
        </span>
      ) : (
        <span className="text-gray-300">—</span>
      ),
  }),
  h.accessor("status", {
    header: "Status",
    cell: (info) => statusBadge(info.getValue()),
  }),
  h.accessor("winner", {
    header: "Winner",
    cell: (info) => {
      const w = info.getValue();
      if (!w) return <span className="text-gray-300">—</span>;
      return (
        <span className="text-sm text-gray-700">
          {w.name} <span className="text-xs text-gray-400">({w.teamName})</span>
        </span>
      );
    },
  }),
];

export default function SeasonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useSeason(id!);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="pt-6">
      <div className="mb-2">
        <Link
          to="/seasons"
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          ← Seasons
        </Link>
      </div>

      {isLoading && <p className="text-sm text-gray-400 mt-4">Loading...</p>}
      {isError && (
        <p className="text-sm text-red-400 mt-4">
          Could not reach the engine API.
        </p>
      )}

      {data && (
        <>
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Season {data.year}
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {data.races.length} race{data.races.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-1.5 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-700"
            >
              Create Race
            </button>
          </div>

          {data.races.length === 0 ? (
            <p className="text-sm text-gray-400">
              No races yet. Create one to get started.
            </p>
          ) : (
            <DataGrid
              data={data.races}
              columns={columns}
              onRowClick={(row) => navigate(`/race/${row.original.id}`)}
            />
          )}
        </>
      )}

      {showModal && id && (
        <CreateRaceModal seasonId={id} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
