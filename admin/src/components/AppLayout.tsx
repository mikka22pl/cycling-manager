import { TopNav } from './TopNav'

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <TopNav />
      <main className="max-w-4xl mx-auto px-6 pb-16">{children}</main>
    </div>
  )
}
