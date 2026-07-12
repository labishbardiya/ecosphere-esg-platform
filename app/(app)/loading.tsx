export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="h-4 w-72 rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl border bg-card p-4">
            <div className="mb-3 h-3 w-20 rounded bg-muted" />
            <div className="h-8 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 rounded-xl border bg-card" />
        <div className="h-56 rounded-xl border bg-card" />
      </div>
    </div>
  )
}
