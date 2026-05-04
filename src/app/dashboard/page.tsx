export default function DashboardPage() {
  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="w-60 shrink-0 border-r border-border bg-card p-4">
        <h2 className="text-lg font-semibold">Sidebar</h2>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <h2 className="text-lg font-semibold">Main</h2>
      </main>
    </div>
  );
}
