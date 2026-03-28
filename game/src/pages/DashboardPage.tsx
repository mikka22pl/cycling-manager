import { Link } from "react-router";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-400 mt-1">
          Here's what's happening in your season.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Season" value="1920" />
        <StatCard label="Race entries" value="—" />
        <StatCard label="Best finish" value="—" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Section title="My Team">
          <p className="text-slate-400 text-sm">
            You haven't created a team yet.
          </p>
          <Link
            to="/team/create"
            className="mt-4 inline-block bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            Create team
          </Link>
        </Section>

        <Section title="Upcoming Races">
          <p className="text-slate-400 text-sm">
            No races scheduled yet. Check back soon.
          </p>
          <Link
            to="/races"
            className="mt-4 inline-block text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
          >
            Browse races →
          </Link>
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-white text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-5">
      <h2 className="text-white font-semibold mb-3">{title}</h2>
      {children}
    </div>
  );
}
