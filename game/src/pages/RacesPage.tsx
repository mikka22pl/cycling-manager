import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  getCurrentSeason,
  getSeasonDetail,
  SeasonDetail,
  SeasonRace,
} from "../api/season";

const STATUS_LABEL: Partial<Record<SeasonRace["status"], string>> = {
  OPEN: "Open",
  PENDING: "Pending",
  RUNNING: "Running",
  FINISHED: "Finished",
};

const STATUS_COLOR: Partial<Record<SeasonRace["status"], string>> = {
  OPEN: "text-lime-500 bg-slate-700",
  PENDING: "text-orange-500 bg-slate-700",
  RUNNING: "text-green-300 bg-green-900",
  FINISHED: "text-slate-300 bg-slate-600",
};

export default function RacesPage() {
  const [season, setSeason] = useState<SeasonDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSeason().then(async (current) => {
      if (current) {
        const detail = await getSeasonDetail(current.id);
        setSeason(detail);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Races</h1>
        <p className="text-slate-400 mt-1">
          Browse open races and request entry for your team.
        </p>
      </div>

      {loading ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">Loading races…</p>
        </div>
      ) : !season ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No races available right now.</p>
          <p className="text-slate-500 text-sm mt-1">
            Races will appear here once the season admin opens entries.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            Season {season.year} — {season.races.length} race
            {season.races.length !== 1 ? "s" : ""}
          </p>
          {season.races.filter((race) => race.status !== "DRAFT").map((race) => (
            <Link
              key={race.id}
              to={`/races/${race.id}`}
              className="block no-underline"
            >
              <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-slate-750 cursor-pointer">
                <div>
                  <p className="text-white font-medium">{race.name}</p>
                  {race.raceGroupName && (
                    <p className="text-slate-500 text-sm">
                      {race.raceGroupName}
                      {race.stageNumber != null
                        ? ` · Stage ${race.stageNumber}`
                        : ""}
                    </p>
                  )}
                  {race.status === "FINISHED" && race.winner && (
                    <p className="text-slate-400 text-sm mt-1">
                      Winner: {race.winner.name} ({race.winner.teamName})
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STATUS_COLOR[race.status]}`}
                >
                  {STATUS_LABEL[race.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
