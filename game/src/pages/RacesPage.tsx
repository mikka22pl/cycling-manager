export default function RacesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Races</h1>
        <p className="text-slate-400 mt-1">Browse open races and request entry for your team.</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400">No races available right now.</p>
        <p className="text-slate-500 text-sm mt-1">
          Races will appear here once the season admin opens entries.
        </p>
      </div>
    </div>
  )
}
