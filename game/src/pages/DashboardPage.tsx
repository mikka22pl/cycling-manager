import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { getMyTeam } from "../api/team";
import { getCurrentSeason, getSeasonDetail } from "../api/season";

export default function DashboardPage() {
  const { user, token } = useAuth();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["my-team"],
    queryFn: () => getMyTeam(token!),
    enabled: !!token,
  });

  const { data: currentSeason } = useQuery({
    queryKey: ["current-season"],
    queryFn: getCurrentSeason,
  });

  const { data: seasonDetail } = useQuery({
    queryKey: ["season-detail", currentSeason?.id],
    queryFn: () => getSeasonDetail(currentSeason!.id),
    enabled: !!currentSeason,
  });

  const pendingRaces = seasonDetail?.races.filter((r) => r.status === "PENDING") ?? [];

  const stageCounts = pendingRaces.reduce<Record<string, number>>((acc, race) => {
    if (race.raceGroupId) {
      acc[race.raceGroupId] = (acc[race.raceGroupId] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-400 mt-1">
          Here's what's happening in your season.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Season" value={currentSeason ? String(currentSeason.year) : "----"} />
        <StatCard label="Race entries" value="—" />
        <StatCard label="Best finish" value="—" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="My Team">
          {teamLoading ? (
            <p className="text-slate-400 text-sm">Loading…</p>
          ) : team ? (
            <div className="space-y-2">
              <p className="text-white font-semibold">{team.name}</p>
              <p className="text-slate-400 text-sm">
                {team.riders.length} cyclist{team.riders.length !== 1 ? "s" : ""}
              </p>
              <Link
                to="/team"
                className="mt-2 inline-block text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
              >
                View team →
              </Link>
            </div>
          ) : (
            <>
              <p className="text-slate-400 text-sm">
                You haven't created a team yet.
              </p>
              <Link
                to="/team/create"
                className="mt-4 inline-block bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                Create team
              </Link>
            </>
          )}
        </Section>

        <Section title="Upcoming Races">
          {pendingRaces.length === 0 ? (
            <>
              <p className="text-slate-400 text-sm">
                No races scheduled yet. Check back soon.
              </p>
              <Link
                to="/races"
                className="mt-4 inline-block text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
              >
                Browse races →
              </Link>
            </>
          ) : (
            <ul className="space-y-2">
              {pendingRaces.map((race) => (
                <li key={race.id}>
                  <Link
                    to={`/races/${race.id}`}
                    className="flex items-center justify-between gap-2 text-sm hover:text-sky-300 transition-colors group"
                  >
                    <span className="text-white group-hover:text-sky-300 font-medium truncate">
                      {race.name}
                    </span>
                    <span className="text-slate-400 whitespace-nowrap shrink-0">
                      {race.raceType === "STAGE" && race.raceGroupId
                        ? `${stageCounts[race.raceGroupId]} stages`
                        : `${race.totalDistance} km`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <h2 className="text-white font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
