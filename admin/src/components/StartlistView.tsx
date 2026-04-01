import { useStartlist } from "../hooks/useStartlist";
import type { CyclistRole } from "../api/client";

const ROLE_CLASSES: Record<CyclistRole, string> = {
  LEADER:     "bg-yellow-100 text-yellow-700",
  DOMESTIQUE: "bg-gray-100 text-gray-500",
  SPRINTER:   "bg-green-100 text-green-700",
  CLIMBER:    "bg-blue-100 text-blue-700",
  ROULEUR:    "bg-purple-100 text-purple-700",
};

function RoleBadge({ role, isLeader }: { role: CyclistRole; isLeader: boolean }) {
  const label = isLeader ? "Leader" : role.charAt(0) + role.slice(1).toLowerCase();
  const cls = isLeader ? "bg-yellow-100 text-yellow-700" : ROLE_CLASSES[role];
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function StartlistView({ raceId }: { raceId: string }) {
  const { data: startlist, isLoading } = useStartlist(raceId);

  if (isLoading) return <p className="text-sm text-gray-400">Loading...</p>;
  if (!startlist || startlist.teams.length === 0)
    return <p className="text-sm text-gray-400">No teams registered yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {startlist.teams.map((team) => (
        <div key={team.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-800">{team.name}</h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {team.cyclists.map((cyclist) => (
              <li key={cyclist.id} className="flex items-center justify-between px-4 py-2">
                <div className="flex items-center gap-2">
                  {cyclist.startNumber != null && (
                    <span className="text-xs font-mono text-gray-400 w-6 text-right">
                      {cyclist.startNumber}
                    </span>
                  )}
                  <span className="text-sm text-gray-700">{cyclist.name}</span>
                </div>
                <RoleBadge role={cyclist.role} isLeader={cyclist.isLeader} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
