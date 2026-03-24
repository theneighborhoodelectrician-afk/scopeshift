export function Sidebar() {
  return (
    <aside className="rounded-3xl border border-white/60 bg-white/90 p-6 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ember">ScopeShift</p>
      <nav className="mt-6 space-y-3 text-sm text-slate">
        <div>Dashboard</div>
        <div>Practice</div>
        <div>Sessions</div>
        <div>Progress</div>
      </nav>
    </aside>
  );
}
