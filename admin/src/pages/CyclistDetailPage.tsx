import { useParams, useSearchParams, Link } from 'react-router'
import { useSnapshotAt } from '../hooks/useSnapshotAt'
import type { Intent } from '../api/client'

const intentBadge = (intent: Intent) => {
  const cls: Record<Intent, string> = {
    SAVE_ENERGY: 'bg-gray-100 text-gray-500',
    FOLLOW_PELOTON: 'bg-blue-50 text-blue-600',
    CHASE: 'bg-amber-50 text-amber-700',
    ATTACK: 'bg-red-50 text-red-600',
    BREAKAWAY: 'bg-orange-50 text-orange-600',
    PROTECT_LEADER: 'bg-purple-50 text-purple-600',
    SPRINT_PREP: 'bg-yellow-50 text-yellow-700',
    SPRINT: 'bg-rose-50 text-rose-600',
  }
  const label = intent.replace(/_/g, ' ').toLowerCase()
  return (
    <span className={`px-1.5 py-0.5 text-xs rounded font-medium capitalize ${cls[intent]}`}>
      {label}
    </span>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-gray-800">{children}</dd>
    </div>
  )
}

export default function CyclistDetailPage() {
  const { raceId, cyclistId } = useParams<{ raceId: string; cyclistId: string }>()
  const [searchParams] = useSearchParams()
  const km = searchParams.get('km') !== null ? Number(searchParams.get('km')) : null

  const { data: snapshot, isLoading } = useSnapshotAt(raceId!, km)
  const cyclist = snapshot?.cyclists.find((c) => c.id === cyclistId)

  const energyColor =
    cyclist && cyclist.energy > 60
      ? 'text-green-600'
      : cyclist && cyclist.energy > 30
        ? 'text-amber-600'
        : 'text-red-500'

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      <Link
        to={`/race/${raceId}`}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← race
      </Link>

      {isLoading && <p className="text-sm text-gray-400">Loading...</p>}

      {!isLoading && !cyclist && (
        <p className="text-sm text-red-400">Cyclist not found in snapshot at {km} km.</p>
      )}

      {cyclist && (
        <>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">{cyclist.name}</h1>
            {cyclist.isDropped && (
              <span className="px-1.5 py-0.5 text-xs rounded font-medium bg-red-50 text-red-500">
                DNF
              </span>
            )}
          </div>

          <section>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              At km {km}
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Stat label="Team">{cyclist.teamName}</Stat>
              <Stat label="Position">
                <span className="font-mono">{cyclist.position.toFixed(2)} km</span>
              </Stat>
              <Stat label="Speed">
                <span className="font-mono">{cyclist.speed.toFixed(1)} km/h</span>
              </Stat>
              <Stat label="Energy">
                <span className={`font-mono ${energyColor}`}>{cyclist.energy.toFixed(0)}%</span>
              </Stat>
              <Stat label="Intent">{intentBadge(cyclist.intent)}</Stat>
              <Stat label="Group">
                {cyclist.groupId ? (
                  <span className="font-mono text-gray-600">{cyclist.groupId}</span>
                ) : (
                  <span className="text-gray-300">—</span>
                )}
              </Stat>
            </dl>
          </section>

          <section>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              IDs
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Stat label="Cyclist ID">
                <span className="font-mono text-xs text-gray-500">{cyclist.id}</span>
              </Stat>
              <Stat label="Team ID">
                <span className="font-mono text-xs text-gray-500">{cyclist.teamId}</span>
              </Stat>
            </dl>
          </section>
        </>
      )}
    </div>
  )
}
