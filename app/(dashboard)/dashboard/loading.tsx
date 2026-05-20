export default function DashboardLoading() {
  return (
    <div className="min-h-full p-8">
      <div className="max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="h-7 w-44 bg-white/[0.06] rounded-lg mb-2 animate-pulse" />
            <div className="h-4 w-64 bg-white/[0.04] rounded-md animate-pulse" style={{ animationDelay: '0.1s' }} />
          </div>
          <div className="h-9 w-28 bg-white/[0.04] rounded-xl animate-pulse" style={{ animationDelay: '0.15s' }} />
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="glass-bright rounded-2xl p-5 animate-pulse" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="h-2.5 w-24 bg-white/[0.07] rounded mb-4" />
              <div className="h-8 w-10 bg-white/[0.1] rounded-lg mb-2" />
              <div className="h-2.5 w-28 bg-white/[0.05] rounded" />
            </div>
          ))}
        </div>

        {/* View switcher */}
        <div className="flex items-center justify-between mb-5">
          <div className="h-9 w-48 bg-white/[0.04] rounded-xl animate-pulse" style={{ animationDelay: '0.25s' }} />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/[0.03] rounded-lg animate-pulse" />
            <div className="h-4 w-36 bg-white/[0.05] rounded animate-pulse" />
            <div className="w-7 h-7 bg-white/[0.03] rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Calendar skeleton */}
        <div className="glass rounded-2xl p-6 animate-pulse" style={{ animationDelay: '0.3s' }}>
          <div className="grid grid-cols-7 mb-3">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-3 mx-3 bg-white/[0.05] rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.03]" style={{ animationDelay: `${i * 0.01}s` }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
