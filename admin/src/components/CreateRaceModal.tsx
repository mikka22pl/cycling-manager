import { useState } from 'react'
import { useCreateRace } from '../hooks/useCreateRace'
import { useCreateRaceGroup } from '../hooks/useCreateRaceGroup'

type Props = {
  seasonId: string
  onClose: () => void
}

export function CreateRaceModal({ seasonId, onClose }: Props) {
  const [raceType, setRaceType] = useState<'SINGLE' | 'STAGED'>('SINGLE')
  const [name, setName] = useState('')
  const [stages, setStages] = useState(['', ''])
  const [openRace, setOpenRace] = useState(false)

  const { mutate: createRace, isPending: racePending, error: raceError } = useCreateRace()
  const { mutate: createRaceGroup, isPending: groupPending, error: groupError } = useCreateRaceGroup()

  const isPending = racePending || groupPending
  const error = raceError || groupError

  const addStage = () => setStages((s) => [...s, ''])
  const removeStage = (i: number) => setStages((s) => s.filter((_, idx) => idx !== i))
  const updateStage = (i: number, value: string) =>
    setStages((s) => s.map((v, idx) => (idx === i ? value : v)))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const status = openRace ? 'OPEN' : 'DRAFT'
    if (raceType === 'SINGLE') {
      createRace({ name: name.trim(), seasonId, status }, { onSuccess: onClose })
    } else {
      const validStages = stages.map((s) => s.trim()).filter(Boolean)
      if (validStages.length < 2) return
      createRaceGroup(
        { name: name.trim(), seasonId, stages: validStages.map((s) => ({ name: s })), status },
        { onSuccess: onClose },
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-gray-900">Create Race</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Race type selector */}
          <div className="flex gap-4">
            {(['SINGLE', 'STAGED'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="raceType"
                  value={t}
                  checked={raceType === t}
                  onChange={() => setRaceType(t)}
                  className="accent-gray-900"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t === 'SINGLE' ? 'Single Race' : 'Staged Race'}
                </span>
              </label>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              {raceType === 'SINGLE' ? 'Race name' : 'Race name (e.g. Tour de Pologne)'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={raceType === 'SINGLE' ? 'San Remo Race' : 'Tour de Pologne'}
              required
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
            />
          </div>

          {/* Stages (only for staged race) */}
          {raceType === 'STAGED' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">
                Stages (minimum 2)
              </label>
              <div className="space-y-2">
                {stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-6 text-right shrink-0">
                      {i + 1}.
                    </span>
                    <input
                      type="text"
                      value={stage}
                      onChange={(e) => updateStage(i, e.target.value)}
                      placeholder={i === 0 ? 'Prologue' : `Stage ${i + 1} name`}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-400"
                    />
                    {stages.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStage(i)}
                        className="text-gray-300 hover:text-red-400 text-sm leading-none"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addStage}
                className="mt-2 text-xs text-gray-500 hover:text-gray-800 underline"
              >
                + Add stage
              </button>
            </div>
          )}

          {/* Open Race */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={openRace}
              onChange={(e) => setOpenRace(e.target.checked)}
              className="accent-gray-900"
            />
            <span className="text-sm font-medium text-gray-700">Open Race</span>
          </label>

          {error && (
            <p className="text-sm text-red-500">{error.message}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              {isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
