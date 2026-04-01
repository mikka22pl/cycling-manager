import { useState, useEffect } from "react";
import { Link } from "react-router";
import { getMyTeam, type TeamResponse } from "../api/team";
import { useAuth } from "../contexts/AuthContext";

const STATS = [
  "stamina",
  "performance",
  "climbing",
  "sprint",
  "vigilance",
  "resistance",
  "recovery",
] as const;

export default function TeamPage() {
  const { token } = useAuth();
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyTeam(token)
      .then(setTeam)
      .catch(() => setTeam(null))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading...</div>;
  }

  console.log("team", team);
  if (!team) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">My Team</h1>
          <p className="text-slate-400 mt-1">
            Manage your cycling team and riders.
          </p>
        </div>
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">You don't have a team yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Create one to start entering races.
          </p>
          <Link
            to="/team/create"
            className="mt-4 inline-block bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            Create your team
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{team.name}</h1>
        <div className="flex gap-4 mt-1 text-sm text-slate-400">
          {team.managerName && <span>Manager: {team.managerName}</span>}
          {team.townName && <span>· {team.townName}</span>}
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-700">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
            Riders
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-5 py-2 text-slate-400 font-medium">
                  Name
                </th>
                {STATS.map((s) => (
                  <th
                    key={s}
                    className="text-center px-3 py-2 text-slate-400 font-medium capitalize"
                  >
                    {s.slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {team.riders.map((rider) => (
                <tr
                  key={rider.id}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-5 py-2.5 text-white font-medium">
                    {rider.name}
                  </td>
                  {STATS.map((s) => {
                    const val = rider.stats[s] ?? 0;
                    return (
                      <td key={s} className="px-3 py-2.5 text-center">
                        <span className={statColor(val)}>{val}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function statColor(val: number): string {
  if (val >= 80) return "text-emerald-400 font-semibold";
  if (val >= 65) return "text-sky-400";
  if (val >= 50) return "text-slate-300";
  return "text-slate-500";
}
