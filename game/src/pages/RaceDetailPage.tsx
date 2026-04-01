import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { getMyTeam, TeamResponse } from "../api/team";
import {
  getRace,
  getMyRaceEntries,
  registerForRace,
  RaceDetail,
  CyclistRole,
  RegisterEntryPayload,
} from "../api/race";

const ROLE_OPTIONS: CyclistRole[] = [
  "LEADER",
  "DOMESTIQUE",
  "SPRINTER",
  "CLIMBER",
  "ROULEUR",
];

const ROLE_LABEL: Record<CyclistRole, string> = {
  LEADER: "Leader",
  DOMESTIQUE: "Domestique",
  SPRINTER: "Sprinter",
  CLIMBER: "Climber",
  ROULEUR: "Rouleur",
};

type Assignment = {
  cyclistId: string;
  name: string;
  isLeader: boolean;
  role: CyclistRole;
};

const STATUS_COLOR: Record<RaceDetail["status"], string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  OPEN: "bg-slate-700 text-lime-500",
  PENDING: "bg-slate-400 text-orange-500",
  RUNNING: "text-green-300 bg-green-900",
  FINISHED: "text-slate-300 bg-slate-600",
};

export default function RaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [race, setRace] = useState<RaceDetail | null>(null);
  const [team, setTeam] = useState<TeamResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [leader, setLeader] = useState<Assignment | null>(null);
  const [domestiques, setDomestiques] = useState<Assignment[]>([]);

  useEffect(() => {
    if (!id || !token) return;
    Promise.all([getRace(id), getMyTeam(token), getMyRaceEntries(id, token)])
      .then(([raceData, teamData, entries]) => {
        setRace(raceData);
        setTeam(teamData);

        // Pre-populate from existing entries
        const leaderEntry = entries.find((e) => e.isLeader);
        const domestiqueEntries = entries.filter((e) => !e.isLeader);
        if (leaderEntry) {
          setLeader({
            cyclistId: leaderEntry.cyclist.id,
            name: leaderEntry.cyclist.name,
            isLeader: true,
            role: leaderEntry.role,
          });
        }
        if (domestiqueEntries.length > 0) {
          setDomestiques(
            domestiqueEntries.map((e) => ({
              cyclistId: e.cyclist.id,
              name: e.cyclist.name,
              isLeader: false,
              role: e.role,
            })),
          );
        }
      })
      .finally(() => setLoading(false));
  }, [id, token]);

  const assignedIds = new Set([
    ...(leader ? [leader.cyclistId] : []),
    ...domestiques.map((d) => d.cyclistId),
  ]);

  function assignLeader(cyclistId: string, name: string) {
    // Return current leader to unassigned
    setLeader({ cyclistId, name, isLeader: true, role: "LEADER" });
  }

  function assignDomestique(cyclistId: string, name: string) {
    setDomestiques((prev) => [
      ...prev,
      { cyclistId, name, isLeader: false, role: "DOMESTIQUE" },
    ]);
  }

  function removeLeader() {
    setLeader(null);
  }

  function removeDomestique(cyclistId: string) {
    setDomestiques((prev) => prev.filter((d) => d.cyclistId !== cyclistId));
  }

  function updateLeaderRole(role: CyclistRole) {
    setLeader((prev) => (prev ? { ...prev, role } : null));
  }

  function updateDomestiqueRole(cyclistId: string, role: CyclistRole) {
    setDomestiques((prev) =>
      prev.map((d) => (d.cyclistId === cyclistId ? { ...d, role } : d)),
    );
  }

  async function handleRegister() {
    if (!id || !token || !leader) return;
    setSubmitting(true);
    setError(null);
    try {
      const entries: RegisterEntryPayload[] = [
        { cyclistId: leader.cyclistId, isLeader: true, role: leader.role },
        ...domestiques.map((d) => ({
          cyclistId: d.cyclistId,
          isLeader: false,
          role: d.role,
        })),
      ];
      await registerForRace(id, entries, token);
      setSuccess(true);
      setTimeout(() => navigate("/races"), 1000);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">Loading race…</p>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">Race not found.</p>
      </div>
    );
  }

  const isOpen = race.status === "OPEN";
  const MAX_DOMESTIQUES = 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{race.name}</h1>
          <p className="text-slate-400 mt-1">
            {race.totalDistance > 0
              ? `${race.totalDistance} km`
              : "Distance TBD"}
          </p>
        </div>
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[race.status]}`}
        >
          {race.status}
        </span>
      </div>

      {!isOpen && (
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400">
            {race.status === "RUNNING" && "This race is currently running."}
          </p>
        </div>
      )}

      {isOpen && !team && (
        <div className="bg-slate-800 rounded-xl p-6 text-center">
          <p className="text-slate-400">
            You need a team to register for a race.
          </p>
        </div>
      )}

      {isOpen && team && (
        <div className="grid grid-cols-2 gap-6">
          {/* Left: Cyclist list */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Your Cyclists</h2>
            <div className="space-y-2">
              {team.riders.map((rider) => {
                const assigned = assignedIds.has(rider.id);
                return (
                  <div
                    key={rider.id}
                    className={`bg-slate-800 rounded-lg px-4 py-3 flex items-center justify-between gap-3 ${assigned ? "opacity-40" : ""}`}
                  >
                    <span className="text-white text-sm font-medium truncate">
                      {rider.name}
                    </span>
                    <div className="flex gap-2 shrink-0">
                      <button
                        disabled={assigned}
                        onClick={() => assignLeader(rider.id, rider.name)}
                        className="text-xs px-2 py-1 rounded bg-sky-700 text-sky-100 hover:bg-sky-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Leader
                      </button>
                      <button
                        disabled={
                          assigned || domestiques.length >= MAX_DOMESTIQUES
                        }
                        onClick={() => assignDomestique(rider.id, rider.name)}
                        className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-200 hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Domestique
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Race lineup */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Race Lineup</h2>
            <div className="space-y-2">
              {/* Leader slot */}
              <div className="bg-slate-800 rounded-lg px-4 py-3">
                <p className="text-xs text-sky-400 font-semibold uppercase tracking-wide mb-2">
                  Leader
                </p>
                {leader ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium flex-1 truncate">
                      {leader.name}
                    </span>
                    <select
                      value={leader.role}
                      onChange={(e) =>
                        updateLeaderRole(e.target.value as CyclistRole)
                      }
                      className="text-xs bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={removeLeader}
                      className="text-slate-400 hover:text-white text-sm leading-none transition-colors"
                      aria-label="Remove leader"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <p className="text-slate-500 text-sm italic">
                    Empty — assign a leader
                  </p>
                )}
              </div>

              {/* Domestique slots */}
              {Array.from({ length: MAX_DOMESTIQUES }).map((_, i) => {
                const d = domestiques[i];
                return (
                  <div key={i} className="bg-slate-800 rounded-lg px-4 py-3">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">
                      Cyclist {i + 1}
                    </p>
                    {d ? (
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium flex-1 truncate">
                          {d.name}
                        </span>
                        <select
                          value={d.role}
                          onChange={(e) =>
                            updateDomestiqueRole(
                              d.cyclistId,
                              e.target.value as CyclistRole,
                            )
                          }
                          className="text-xs bg-slate-700 text-slate-200 border border-slate-600 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r]}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => removeDomestique(d.cyclistId)}
                          className="text-slate-400 hover:text-white text-sm leading-none transition-colors"
                          aria-label="Remove cyclist"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm italic">Empty</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <div className="pt-2 space-y-2">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {success && (
                <p className="text-green-400 text-sm">
                  Registered! Redirecting…
                </p>
              )}
              <button
                disabled={!leader || submitting || success}
                onClick={handleRegister}
                className="w-full py-2 rounded-lg bg-sky-600 text-white font-medium hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Registering…" : "Register Team"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
