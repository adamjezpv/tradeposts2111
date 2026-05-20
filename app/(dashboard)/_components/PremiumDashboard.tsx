'use client'

import { useState } from 'react'

type Post = {
  id: string
  content: string
  scheduled_at: string
  status: string
  locations: { business_name: string }[] | null
}

type Props = {
  firstName: string
  plan: string
  posts: Post[]
  locationCount: number
  industry: string | null
  firstLocationName: string | null
}

function isAgencyPlan(plan: string) {
  return plan === 'agency'
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const DAY_ABBREVS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function PremiumDashboard({
  firstName,
  plan,
  posts,
  locationCount,
  industry,
  firstLocationName,
}: Props) {
  const isAgency = isAgencyPlan(plan)
  const [view, setView] = useState<'calendar' | 'queue'>('calendar')
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const postsByDate: Record<string, Post[]> = {}
  for (const post of posts) {
    const d = new Date(post.scheduled_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!postsByDate[key]) postsByDate[key] = []
    postsByDate[key].push(post)
  }

  const nextPost = posts[0] ?? null
  const nextPostDate = nextPost ? new Date(nextPost.scheduled_at) : null
  const nextPostLabel = nextPostDate
    ? nextPostDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      nextPostDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : 'None scheduled'

  const goToPrev = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11) }
    else setCalMonth(m => m - 1)
  }
  const goToNext = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0) }
    else setCalMonth(m => m + 1)
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gradient tracking-tight mb-1">
              Command Center
            </h1>
            <p className="text-white/30 text-sm">Welcome back, {firstName}. Here&apos;s your publishing overview.</p>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isAgency ? 'bg-white/80' : 'bg-white/50'}`} />
            <span className="text-white/50 text-xs font-medium capitalize">
              {plan === 'agency' ? 'Agency' : plan === 'solo' ? 'Solo' : plan}
            </span>
            {isAgency && (
              <span className="text-[9px] font-semibold tracking-widest uppercase text-white/30 border border-white/[0.1] px-1.5 py-0.5 rounded">
                Full Access
              </span>
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-bright rounded-2xl p-5">
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3">Scheduled Posts</p>
            <p className="text-white text-3xl font-bold tracking-tight">{posts.length}</p>
            <p className="text-white/25 text-xs mt-1.5">pending publication</p>
          </div>

          <div className="glass-bright rounded-2xl p-5">
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3">Active Industry</p>
            <p className="text-white text-sm font-semibold leading-snug">
              {industry ?? '—'}
            </p>
            {firstLocationName && (
              <p className="text-white/25 text-xs mt-1.5 truncate">{firstLocationName}</p>
            )}
            {!firstLocationName && (
              <p className="text-white/20 text-xs mt-1.5">No location connected</p>
            )}
          </div>

          <div className="glass-bright rounded-2xl p-5">
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3">Next Publication</p>
            <p className="text-white text-sm font-semibold leading-snug">{nextPostLabel}</p>
            <p className="text-white/25 text-xs mt-1.5">via scheduled cron</p>
          </div>
        </div>

        {/* Agency gate — shown to solo users managing multiple locations */}
        {!isAgency && locationCount > 1 && (
          <div className="glass rounded-2xl px-5 py-4 mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
              <p className="text-white/40 text-xs leading-relaxed">
                You have <span className="text-white/60 font-medium">{locationCount} locations</span>. Upgrade to Agency to manage all of them from the calendar.
              </p>
            </div>
            <a
              href="/upgrade"
              className="flex-shrink-0 text-[10px] font-semibold text-white/60 hover:text-white border border-white/[0.1] hover:border-white/25 px-3 py-1.5 rounded-lg transition-all"
            >
              Upgrade
            </a>
          </div>
        )}

        {/* View Switcher + Nav */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 glass rounded-xl p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                view === 'calendar'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/35 hover:text-white/55'
              }`}
            >
              Calendar View
            </button>
            <button
              onClick={() => setView('queue')}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all duration-150 ${
                view === 'queue'
                  ? 'bg-white/[0.1] text-white'
                  : 'text-white/35 hover:text-white/55'
              }`}
            >
              Queue View
            </button>
          </div>

          {view === 'calendar' && (
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrev}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all text-sm"
              >
                ←
              </button>
              <span className="text-white/50 text-sm font-medium w-36 text-center">
                {MONTH_NAMES[calMonth]} {calYear}
              </span>
              <button
                onClick={goToNext}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-all text-sm"
              >
                →
              </button>
            </div>
          )}
        </div>

        {view === 'calendar' ? (
          <CalendarView
            calMonth={calMonth}
            calYear={calYear}
            today={today}
            postsByDate={postsByDate}
            isAgency={isAgency}
          />
        ) : (
          <QueueView posts={posts} isAgency={isAgency} />
        )}

      </div>
    </div>
  )
}

function CalendarView({
  calMonth,
  calYear,
  today,
  postsByDate,
  isAgency,
}: {
  calMonth: number
  calYear: number
  today: Date
  postsByDate: Record<string, Post[]>
  isAgency: boolean
}) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startOffset + 1
    return d >= 1 && d <= daysInMonth ? d : null
  })

  const selectedPosts = selectedKey ? (postsByDate[selectedKey] ?? []) : []

  return (
    <div>
      <div className="glass rounded-2xl p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-3">
          {DAY_ABBREVS.map(d => (
            <div key={d} className="text-center text-white/20 text-[10px] uppercase tracking-widest py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} className="h-14" />

            const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayPosts = postsByDate[key] ?? []
            const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day
            const isSelected = selectedKey === key
            const hasPosts = dayPosts.length > 0

            return (
              <button
                key={idx}
                onClick={() => setSelectedKey(isSelected ? null : key)}
                className={`h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                  isSelected
                    ? 'bg-white/[0.12] ring-1 ring-white/20'
                    : isToday
                    ? 'bg-white/[0.07]'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <span className={`text-xs font-medium ${
                  isToday ? 'text-white' : isSelected ? 'text-white/80' : 'text-white/40'
                }`}>
                  {day}
                </span>
                {hasPosts && (
                  <div className="flex items-center gap-0.5">
                    {dayPosts.slice(0, 3).map((_, i) => (
                      <span
                        key={i}
                        className="w-1 h-1 rounded-full bg-white/45"
                      />
                    ))}
                    {dayPosts.length > 3 && (
                      <span className="text-white/20 text-[8px] ml-0.5">+{dayPosts.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedKey && (
        <div className="mt-4">
          <p className="text-white/30 text-xs mb-3">
            {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {selectedPosts.length > 0
              ? ` — ${selectedPosts.length} post${selectedPosts.length !== 1 ? 's' : ''}`
              : ' — no posts scheduled'}
          </p>
          {selectedPosts.length > 0 ? (
            <div className="space-y-2">
              {selectedPosts.map(post => {
                const words = post.content.split(' ')
                const preview = words.slice(0, 22).join(' ') + (words.length > 22 ? '...' : '')
                return (
                  <div key={post.id} className="glass rounded-xl p-4">
                    <p className="text-white/55 text-xs leading-relaxed">{preview}</p>
                    {post.locations?.[0]?.business_name && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/[0.05]">
                        <p className="text-white/20 text-[10px]">
                          {post.locations[0].business_name}
                        </p>
                        {!isAgency && (
                          <a href="/upgrade" className="text-[9px] text-white/20 hover:text-white/40 transition-colors">
                            Agency →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="glass rounded-xl p-5 text-center">
              <p className="text-white/20 text-xs">No posts scheduled for this day.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QueueView({ posts, isAgency }: { posts: Post[]; isAgency: boolean }) {
  if (posts.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="1" y="1" width="18" height="18" rx="3" stroke="white" strokeOpacity="0.2" />
            <line x1="5" y1="7" x2="15" y2="7" stroke="white" strokeOpacity="0.2" strokeLinecap="round" />
            <line x1="5" y1="10.5" x2="15" y2="10.5" stroke="white" strokeOpacity="0.2" strokeLinecap="round" />
            <line x1="5" y1="14" x2="10" y2="14" stroke="white" strokeOpacity="0.2" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-white/35 text-sm font-medium mb-1.5">Queue is empty</p>
        <p className="text-white/20 text-xs max-w-xs mx-auto leading-relaxed">
          Generate posts from the Locations page to fill your queue.
        </p>
      </div>
    )
  }

  // Group by date for visual separation
  const grouped: { dateLabel: string; posts: Post[] }[] = []
  let lastLabel = ''
  for (const post of posts) {
    const d = new Date(post.scheduled_at)
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    if (label !== lastLabel) {
      grouped.push({ dateLabel: label, posts: [] })
      lastLabel = label
    }
    grouped[grouped.length - 1].posts.push(post)
  }

  // Collect unique locations across all queued posts
  const uniqueLocations = Array.from(
    new Set(posts.flatMap(p => p.locations?.map(l => l.business_name) ?? []))
  )

  return (
    <div className="space-y-6">
      {/* Agency: show all-location summary bar; Solo: show upgrade nudge if multi-location */}
      {isAgency && uniqueLocations.length > 1 && (
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
          <p className="text-white/40 text-xs">
            Showing queue for <span className="text-white/60 font-medium">{uniqueLocations.length} locations</span>
          </p>
        </div>
      )}
      {grouped.map(({ dateLabel, posts: dayPosts }) => (
        <div key={dateLabel}>
          <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2.5">{dateLabel}</p>
          <div className="space-y-2">
            {dayPosts.map(post => {
              const d = new Date(post.scheduled_at)
              const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              const words = post.content.split(' ')
              const preview = words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '')

              return (
                <div
                  key={post.id}
                  className="glass rounded-xl p-4 flex items-start gap-4 hover:bg-white/[0.05] transition-all duration-150 group"
                >
                  <div className="flex-shrink-0 pt-0.5">
                    <span className="text-white/30 text-xs font-medium tabular-nums">{timeStr}</span>
                  </div>
                  <div className="w-px self-stretch bg-white/[0.07] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white/55 text-xs leading-relaxed">{preview}</p>
                    {post.locations?.[0]?.business_name && (
                      <p className="text-white/20 text-[10px] mt-1.5 truncate">
                        {post.locations[0].business_name}
                      </p>
                    )}
                  </div>
                  <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded-full border border-white/[0.08] flex-shrink-0 self-start">
                    {post.status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
