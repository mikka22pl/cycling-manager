import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useRace } from "../hooks/useRace";
import { useSnapshots } from "../hooks/useSnapshots";
import { useSnapshotAt } from "../hooks/useSnapshotAt";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { SegmentsGrid } from "../components/SegmentsGrid";
import { AddSegmentsForm } from "../components/AddSegmentsForm";
import { SnapshotGrid } from "../components/SnapshotGrid";
import { LeaderboardGrid } from "../components/LeaderboardGrid";
import { KmSlider } from "../components/KmSlider";
import { StartlistView } from "../components/StartlistView";
import { useCloseStartlist } from "../hooks/useCloseStartlist";
import { useOpenRace } from "../hooks/useOpenRace";
import { useSimulateRace } from "../hooks/useSimulateRace";
import type { RaceStatus } from "../api/client";

const STATUS_CLASSES: Record<RaceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-500",
  OPEN: "bg-green-800 text-lime-500",
  PENDING: "bg-gray-100 text-orange-500",
  RUNNING: "bg-amber-50 text-amber-700",
  FINISHED: "bg-green-50 text-green-700",
};

function StatusBadge({ status }: { status: RaceStatus }) {
  return (
    <span
      className={`px-1.5 py-0.5 text-xs rounded font-medium ${STATUS_CLASSES[status]}`}
    >
      {status}
    </span>
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
    <section>
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

type Tab = "course" | "startlist" | "snapshots" | "results";

const TAB_LABELS: Record<Tab, string> = {
  course: "Course",
  startlist: "Startlist",
  snapshots: "Snapshots",
  results: "Final Results",
};

export default function RaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedKm, setSelectedKm] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("course");

  const { data: race, isLoading } = useRace(id!);
  const isDraft = race?.status === "DRAFT";
  const isOpen = race?.status === "OPEN";
  const isPending = race?.status === "PENDING";
  const isRunning = race?.status === "RUNNING";
  const isFinished = race?.status === "FINISHED";

  const { mutate: openRace, isPending: isOpening } = useOpenRace(id!);
  const { mutate: closeStartlist, isPending: isClosing } = useCloseStartlist(id!);
  const { mutate: simulateRace, isPending: isSimulating } = useSimulateRace(id!);

  const { data: snapshots } = useSnapshots(id!, isRunning);
  const kms = (snapshots?.map((s) => s.km) ?? []).sort((a, b) => a - b);

  const effectiveKm =
    selectedKm ?? (kms.length > 0 ? kms[kms.length - 1] : null);

  const { data: snapshot, isFetching: snapshotFetching } = useSnapshotAt(
    id!,
    effectiveKm,
  );
  const { data: leaderboard } = useLeaderboard(id!, isFinished);

  function handleSnapshotRowClick(c: { id: string }) {
    navigate(`/race/${id}/cyclist/${c.id}?km=${effectiveKm}`);
  }

  function handleLeaderboardRowClick(e: { id: string; position: number }) {
    navigate(
      `/race/${id}/cyclist/${e.id}?km=${kms[kms.length - 1] ?? e.position}`,
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!race) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-red-400">Race not found.</p>
      </div>
    );
  }

  const tabs: Tab[] = [
    "course",
    "startlist",
    "snapshots",
    ...(isFinished ? (["results"] as Tab[]) : []),
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
      {/* Back */}
      <Link
        to="/"
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← races
      </Link>

      {/* A. Race header */}
      <div>
        <div className="flex items-center gap-3 mb-5">
          <h1 className="text-xl font-semibold text-gray-900">{race.name}</h1>
          <StatusBadge status={race.status} />
          {isDraft && (
            <button
              onClick={() => openRace()}
              disabled={isOpening}
              className="ml-auto px-3 py-1.5 text-xs font-medium rounded bg-blue-700 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isOpening ? "Opening…" : "Open"}
            </button>
          )}
          {isOpen && (
            <button
              onClick={() => closeStartlist()}
              disabled={isClosing}
              className="ml-auto px-3 py-1.5 text-xs font-medium rounded bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isClosing ? "Closing…" : "Close Startlist"}
            </button>
          )}
          {isPending && (
            <button
              onClick={() => simulateRace()}
              disabled={isSimulating}
              className="ml-auto px-3 py-1.5 text-xs font-medium rounded bg-green-700 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSimulating ? "Starting…" : "Start"}
            </button>
          )}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
              Distance
            </dt>
            <dd className="text-sm text-gray-800 font-mono">
              {race.totalDistance} km
            </dd>
          </div>
          {race.seed != null && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Seed
              </dt>
              <dd className="text-sm text-gray-800 font-mono">{race.seed}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
              Created
            </dt>
            <dd className="text-sm text-gray-700">
              {new Date(race.createdAt).toLocaleString()}
            </dd>
          </div>
          {race.finishedAt && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">
                Finished
              </dt>
              <dd className="text-sm text-gray-700">
                {new Date(race.finishedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* B. Course segments */}
      {activeTab === "course" && (
        <Section title="Course">
          {race.segments.length > 0 && (
            <SegmentsGrid segments={race.segments} />
          )}
          {race.segments.length === 0 && !isDraft && (
            <p className="text-sm text-gray-400">No segments.</p>
          )}
          {isDraft && (
            <div className={race.segments.length > 0 ? "mt-6" : ""}>
              {race.segments.length > 0 && (
                <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
                  Add segments
                </p>
              )}
              <AddSegmentsForm
                raceId={id!}
                currentEndKm={
                  race.segments.length > 0
                    ? Math.max(...race.segments.map((s) => s.endKm))
                    : 0
                }
              />
            </div>
          )}
        </Section>
      )}

      {/* C. Startlist */}
      {activeTab === "startlist" && (
        <Section title="Startlist">
          <StartlistView raceId={id!} />
        </Section>
      )}

      {/* D. Snapshot browser */}
      {activeTab === "snapshots" && (
        <Section title="Snapshots">
          {kms.length === 0 ? (
            <p className="text-sm text-gray-400">No snapshots yet.</p>
          ) : (
            <>
              <div className="mb-4">
                <KmSlider
                  kms={kms}
                  selected={effectiveKm}
                  onChange={setSelectedKm}
                />
              </div>
              {snapshotFetching && !snapshot && (
                <p className="text-sm text-gray-400 py-4">Loading...</p>
              )}
              {snapshot && (
                <SnapshotGrid
                  cyclists={snapshot.cyclists}
                  onRowClick={handleSnapshotRowClick}
                />
              )}
            </>
          )}
        </Section>
      )}

      {/* E. Final results */}
      {isFinished && activeTab === "results" && (
        <Section title="Final Results">
          {leaderboard ? (
            <LeaderboardGrid
              entries={leaderboard}
              onRowClick={handleLeaderboardRowClick}
            />
          ) : (
            <p className="text-sm text-gray-400">Loading...</p>
          )}
        </Section>
      )}
    </div>
  );
}
