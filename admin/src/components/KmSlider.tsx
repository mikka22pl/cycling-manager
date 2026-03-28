type KmSliderProps = {
  kms: number[]
  selected: number | null
  onChange: (km: number) => void
}

export function KmSlider({ kms, selected, onChange }: KmSliderProps) {
  if (kms.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {kms.map((km) => (
        <button
          key={km}
          onClick={() => onChange(km)}
          className={`px-2 py-0.5 text-xs rounded font-mono transition-colors ${
            selected === km
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700'
          }`}
        >
          {km}
        </button>
      ))}
    </div>
  )
}
