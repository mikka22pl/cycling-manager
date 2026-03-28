import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router'
import { useRace } from '../hooks/useRace'
import { useSnapshots } from '../hooks/useSnapshots'
import { useSnapshotAt } from '../hooks/useSnapshotAt'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { SegmentsGrid } from '../components/SegmentsGrid'
import { AddSegmentsForm } from '../components/AddSegmentsForm'
import { SnapshotGrid } from '../components/SnapshotGrid'
import { LeaderboardGrid } from '../components/LeaderboardGrid'
import { KmSlider } from '../components/KmSlider'
import type { RaceStatus } from '../api/client'

const statusBadge = (status: RaceStatus) => {
  const cls = {
    PENDING: 'bg-gray-100 text-gray-500',
    RUNNING: 'bg-amber-50 text-amber-700',
    FINISHED: 'bg-green-50 text-green-700',
  }[status]
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium ${cls}`}>{status}</span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}

export default function RaceDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [selectedKm, setSelectedKm] = useState<number | null>(null)

  const { data: race, isLoading } = useRace(id!)
  const isPending = race?.status === 'PENDING'
  const isRunning = race?.status === 'RUNNING'
  const isFinished = race?.status === 'FINISHED'

  const { data: snapshots } = useSnapshots(id!, isRunning)
  const kms = (snapshots?.map((s) => s.km) ?? []).sort((a, b) => a - b)

  // Show the latest km by default; follow the race if nothing is manually selected
  const effectiveKm = selectedKm ?? (kms.length > 0 ? kms[kms.length - 1] : null)

  const { data: snapshot, isFetching: snapshotFetching } = useSnapshotAt(id!, effectiveKm)
  const { data: leaderboard } = useLeaderboard(id!, isFinished)

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    )
  }

  if (!race) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm text-red-400">Race not found.</p>
      </div>
    )
  }

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
          {statusBadge(race.status)}
        </div>
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Distance</dt>
            <dd className="text-sm text-gray-800 font-mono">{race.totalDistance} km</dd>
          </div>
          {race.seed != null && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Seed</dt>
              <dd className="text-sm text-gray-800 font-mono">{race.seed}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Created</dt>
            <dd className="text-sm text-gray-700">{new Date(race.createdAt).toLocaleString()}</dd>
          </div>
          {race.finishedAt && (
            <div>
              <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Finished</dt>
              <dd className="text-sm text-gray-700">
                {new Date(race.finishedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* B. Course segments */}
      <Section title="Course">
        {race.segments.length > 0 && <SegmentsGrid segments={race.segments} />}
        {race.segments.length === 0 && !isPending && (
          <p className="text-sm text-gray-400">No segments.</p>
        )}
        {isPending && (
          <div className={race.segments.length > 0 ? 'mt-6' : ''}>
            {race.segments.length > 0 && (
              <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
                Add segments
              </p>
            )}
            <AddSegmentsForm
              raceId={id!}
              currentEndKm={race.segments.length > 0
                ? Math.max(...race.segments.map((s) => s.endKm))
                : 0}
            />
          </div>
        )}
      </Section>

      {/* C. Snapshot browser */}
      <Section title="Snapshots">
        {kms.length === 0 ? (
          <p className="text-sm text-gray-400">No snapshots yet.</p>
        ) : (
          <>
            <div className="mb-4">
              <KmSlider kms={kms} selected={effectiveKm} onChange={setSelectedKm} />
            </div>
            {snapshotFetching && !snapshot && (
              <p className="text-sm text-gray-400 py-4">Loading...</p>
            )}
            {snapshot && (
              <SnapshotGrid
                cyclists={snapshot.cyclists}
                onRowClick={(c) => navigate(`/race/${id}/cyclist/${c.id}?km=${effectiveKm}`)}
              />
            )}
          </>
        )}
      </Section>

      {/* D. Final results */}
      {isFinished && (
        <Section title="Final Results">
          {leaderboard ? (
            <LeaderboardGrid
              entries={leaderboard}
              onRowClick={(e) =>
                navigate(`/race/${id}/cyclist/${e.id}?km=${kms[kms.length - 1] ?? e.position}`)
              }
            />
          ) : (
            <p className="text-sm text-gray-400">Loading...</p>
          )}
        </Section>
      )}
    </div>
  )
}
