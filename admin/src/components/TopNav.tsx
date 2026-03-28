import { NavLink } from 'react-router'

export function TopNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-gray-900 text-gray-900'
        : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
    }`

  return (
    <nav className="border-b border-gray-200 mb-8">
      <div className="max-w-4xl mx-auto px-6 pt-6">
        <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mb-4">
          Cycling Manager
        </p>
        <div className="flex gap-6">
          <NavLink to="/" end className={linkClass}>
            Races
          </NavLink>
          <NavLink to="/seasons" className={linkClass}>
            Seasons
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
