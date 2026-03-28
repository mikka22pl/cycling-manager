import { Link } from 'react-router'

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Team</h1>
          <p className="text-slate-400 mt-1">Manage your cycling team and riders.</p>
        </div>
        <Link
          to="/team/create"
          className="bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          Create team
        </Link>
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
  )
}
