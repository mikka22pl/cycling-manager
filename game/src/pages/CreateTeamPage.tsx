import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { createTeam } from '../api/team'

const NATIONALITIES: Array<{ code: string; name: string }> = [
  { code: 'GBR', name: 'Great Britain' },
  { code: 'FRA', name: 'France' },
  { code: 'ITA', name: 'Italy' },
  { code: 'SPA', name: 'Spain' },
  { code: 'GER', name: 'Germany' },
  { code: 'NED', name: 'Netherlands' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'POL', name: 'Poland' },
  { code: 'SUI', name: 'Switzerland' },
  { code: 'CZE', name: 'Czech Republic' },
]

export default function CreateTeamPage() {
  const navigate = useNavigate()
  const [teamName, setTeamName] = useState('')
  const [townName, setTownName] = useState('')
  const [managerName, setManagerName] = useState('')
  const [nationality, setNationality] = useState('GBR')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createTeam({ name: teamName, townName, managerName, nationality })
      navigate('/team')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create your team</h1>
        <p className="text-slate-400 mt-1">
          Set up your team identity. Riders will be generated automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-5">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <Field id="teamName" label="Team name" required>
          <input
            id="teamName"
            type="text"
            required
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g. Velo Alpina"
            className={inputClass}
          />
        </Field>

        <Field id="townName" label="Home town" required>
          <input
            id="townName"
            type="text"
            required
            value={townName}
            onChange={(e) => setTownName(e.target.value)}
            placeholder="e.g. Lyon"
            className={inputClass}
          />
        </Field>

        <Field id="managerName" label="Manager name" required>
          <input
            id="managerName"
            type="text"
            required
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="e.g. Pierre Martin"
            className={inputClass}
          />
        </Field>

        <Field id="nationality" label="Nationality">
          <select
            id="nationality"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className={inputClass}
          >
            {NATIONALITIES.map(({ code, name }) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </Field>

        <div className="pt-1 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-5 py-2 transition-colors"
          >
            {loading ? 'Creating team...' : 'Create team'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

const inputClass =
  'w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent'

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1" htmlFor={id}>
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
