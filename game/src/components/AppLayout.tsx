import { NavBar } from './NavBar'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
