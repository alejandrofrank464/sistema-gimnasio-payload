export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="space-y-2">
        <div className="bg-muted h-7 w-48 animate-pulse rounded-md" />
        <div className="bg-muted h-4 w-72 animate-pulse rounded-md" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-card border-border rounded-xl border p-5">
            <div className="bg-muted mb-3 h-3 w-24 animate-pulse rounded" />
            <div className="bg-muted h-8 w-28 animate-pulse rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="bg-card border-border lg:col-span-2 rounded-xl border p-5">
          <div className="bg-muted mb-4 h-3 w-40 animate-pulse rounded" />
          <div className="bg-muted h-[240px] animate-pulse rounded-lg" />
        </div>
        <div className="bg-card border-border rounded-xl border p-5">
          <div className="bg-muted mb-4 h-3 w-36 animate-pulse rounded" />
          <div className="bg-muted h-[240px] animate-pulse rounded-lg" />
        </div>
      </div>

      <div className="bg-card border-border rounded-xl border p-5">
        <div className="bg-muted mb-4 h-3 w-32 animate-pulse rounded" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-muted h-10 animate-pulse rounded" />
          ))}
        </div>
      </div>
    </div>
  )
}
