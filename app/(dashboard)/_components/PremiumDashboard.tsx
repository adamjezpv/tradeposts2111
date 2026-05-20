'use client'

import { useState } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import CalendarPostModal, { parsePostContent } from './CalendarPostModal'

type Post = {
  id: string
  content: string
  scheduled_at: string
  status: string
  error_message: string | null
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

function getPreviewText(content: string, wordLimit = 22): string {
  const parsed = parsePostContent(content)
  const text = parsed.google || parsed.facebook || parsed.linkedin || parsed.reddit || content
  const words = text.split(' ')
  return words.slice(0, wordLimit).join(' ') + (words.length > wordLimit ? '…' : '')
}

function getStatusDotColor(status: string): string {
  switch (status) {
    case 'published': return 'bg-green-400'
    case 'scheduled': return 'bg-orange-400'
    case 'failed': return 'bg-red-500'
    default: return 'bg-white/45'
  }
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

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
  }

  const childVariants: Variants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
  }

  const metricsVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } },
  }

  const metricCardVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' as const } },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-full p-8"
    >
      <div className="max-w-5xl">

        {/* Header */}
        <motion.div variants={childVariants} className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gradient tracking-tight mb-1">
              Command Center
            </h1>
            <p className="text-white/30 text-sm">Welcome back, {firstName}. Here&apos;s your publishing overview.</p>
          </div>
          <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${isAgency ? 'bg-white/80 animate-pulse' : 'bg-white/50'}`} />
            <span className="text-white/50 text-xs font-medium capitalize">
              {plan === 'agency' ? 'Agency' : plan === 'solo' ? 'Solo' : plan}
            </span>
            {isAgency && (
              <span className="text-[9px] font-semibold tracking-widest uppercase text-white/30 border border-white/[0.1] px-1.5 py-0.5 rounded">
                Full Access
              </span>
            )}
          </div>
        </motion.div>

        {/* Metrics */}
        <motion.div
          variants={metricsVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <motion.div
            variants={metricCardVariants}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="glass-bright rounded-2xl p-5"
          >
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3">Scheduled Posts</p>
            <motion.p
              className="text-white text-3xl font-bold tracking-tight"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: 'backOut', delay: 0.3 }}
            >
              {posts.length}
            </motion.p>
            <p className="text-white/25 text-xs mt-1.5">pending publication</p>
          </motion.div>

          <motion.div
            variants={metricCardVariants}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="glass-bright rounded-2xl p-5"
          >
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
          </motion.div>

          <motion.div
            variants={metricCardVariants}
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="glass-bright rounded-2xl p-5"
          >
            <p className="text-white/25 text-[10px] uppercase tracking-widest mb-3">Next Publication</p>
            <p className="text-white text-sm font-semibold leading-snug" suppressHydrationWarning>{nextPostLabel}</p>
            <p className="text-white/25 text-xs mt-1.5">via scheduled cron</p>
          </motion.div>
        </motion.div>

        {/* Agency gate */}
        {!isAgency && locationCount > 1 && (
          <motion.div
            variants={childVariants}
            className="glass rounded-2xl px-5 py-4 mb-5 flex items-center justify-between gap-4"
          >
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
          </motion.div>
        )}

        {/* View Switcher + Nav */}
        <motion.div variants={childVariants} className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-1 glass rounded-xl p-1 relative">
            <button
              onClick={() => setView('calendar')}
              className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-150 z-10 ${
                view === 'calendar' ? 'text-white' : 'text-white/35 hover:text-white/55'
              }`}
            >
              {view === 'calendar' && (
                <motion.span
                  layoutId="view-indicator"
                  className="absolute inset-0 bg-white/[0.1] rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              Calendar View
            </button>
            <button
              onClick={() => setView('queue')}
              className={`relative px-4 py-2 rounded-lg text-xs font-medium transition-colors duration-150 z-10 ${
                view === 'queue' ? 'text-white' : 'text-white/35 hover:text-white/55'
              }`}
            >
              {view === 'queue' && (
                <motion.span
                  layoutId="view-indicator"
                  className="absolute inset-0 bg-white/[0.1] rounded-lg -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              Queue View
            </button>
          </div>

          <AnimatePresence>
            {view === 'calendar' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2"
              >
                <motion.button
                  onClick={goToPrev}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors text-sm"
                >
                  ←
                </motion.button>
                <span className="text-white/50 text-sm font-medium w-36 text-center">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <motion.button
                  onClick={goToNext}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.05] transition-colors text-sm"
                >
                  →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <CalendarView
                calMonth={calMonth}
                calYear={calYear}
                today={today}
                postsByDate={postsByDate}
                isAgency={isAgency}
              />
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <QueueView posts={posts} isAgency={isAgency} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </motion.div>
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
  const [editPost, setEditPost] = useState<Post | null>(null)

  const firstDow = new Date(calYear, calMonth, 1).getDay()
  const startOffset = firstDow === 0 ? 6 : firstDow - 1
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7

  const cells: (number | null)[] = Array.from({ length: totalCells }, (_, i) => {
    const d = i - startOffset + 1
    return d >= 1 && d <= daysInMonth ? d : null
  })

  const selectedPosts = selectedKey ? (postsByDate[selectedKey] ?? []) : []

  function handleDayClick(key: string, dayPosts: Post[]) {
    if (dayPosts.length === 1) {
      setEditPost(dayPosts[0])
      setSelectedKey(null)
      return
    }
    setSelectedKey(prev => prev === key ? null : key)
  }

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
                onClick={() => handleDayClick(key, dayPosts)}
                suppressHydrationWarning
                className={`h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
                  isSelected
                    ? 'bg-white/[0.12] ring-1 ring-white/20'
                    : isToday
                    ? 'bg-white/[0.07]'
                    : hasPosts
                    ? 'hover:bg-white/[0.06] cursor-pointer'
                    : 'hover:bg-white/[0.04]'
                }`}
              >
                <span suppressHydrationWarning className={`text-xs font-medium ${
                  isToday ? 'text-white' : isSelected ? 'text-white/80' : 'text-white/40'
                }`}>
                  {day}
                </span>
                {hasPosts && (
                  <div className="flex items-center gap-0.5">
                    {dayPosts.slice(0, 3).map((post, i) => (
                      <span
                        key={i}
                        className={`w-1 h-1 rounded-full ${getStatusDotColor(post.status)}`}
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

      {/* Selected day detail (shown for days with multiple posts) */}
      {selectedKey && (
        <div className="mt-4">
          <p className="text-white/30 text-xs mb-3">
            {new Date(selectedKey + 'T12:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
            {selectedPosts.length > 0
              ? ` — ${selectedPosts.length} post${selectedPosts.length !== 1 ? 's' : ''} — click to edit`
              : ' — no posts scheduled'}
          </p>
          {selectedPosts.length > 0 ? (
            <div className="space-y-2">
              {selectedPosts.map(post => {
                const preview = getPreviewText(post.content)
                return (
                  <div
                    key={post.id}
                    className="glass rounded-xl p-4 cursor-pointer hover:bg-white/[0.06] transition-all duration-150 group"
                    onClick={() => setEditPost(post)}
                  >
                    <div className="flex items-start gap-3">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${getStatusDotColor(post.status)}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/55 text-xs leading-relaxed">{preview}</p>
                        {post.locations?.[0]?.business_name && (
                          <p className="text-white/20 text-[10px] mt-1.5">
                            {post.locations[0].business_name}
                          </p>
                        )}
                      </div>
                      <svg className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    {!isAgency && (
                      <div className="mt-2 pt-2 border-t border-white/[0.05] flex justify-end">
                        <a href="/upgrade" className="text-[9px] text-white/20 hover:text-white/40 transition-colors" onClick={e => e.stopPropagation()}>
                          Agency →
                        </a>
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

      {/* Edit modal */}
      <AnimatePresence>
        {editPost && (
          <CalendarPostModal
            key={editPost.id}
            post={editPost}
            onClose={() => setEditPost(null)}
          />
        )}
      </AnimatePresence>
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

  const uniqueLocations = Array.from(
    new Set(posts.flatMap(p => p.locations?.map(l => l.business_name) ?? []))
  )

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      className="space-y-6"
    >
      {isAgency && uniqueLocations.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <span className="w-1 h-1 rounded-full bg-white/50 flex-shrink-0" />
          <p className="text-white/40 text-xs">
            Showing queue for <span className="text-white/60 font-medium">{uniqueLocations.length} locations</span>
          </p>
        </motion.div>
      )}
      {grouped.map(({ dateLabel, posts: dayPosts }, gi) => (
        <motion.div
          key={dateLabel}
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } } } satisfies Variants}
        >
          <p className="text-white/25 text-[10px] uppercase tracking-widest mb-2.5">{dateLabel}</p>
          <div className="space-y-2">
            {dayPosts.map((post, pi) => {
              const d = new Date(post.scheduled_at)
              const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              const preview = getPreviewText(post.content, 20)

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut', delay: gi * 0.08 + pi * 0.04 }}
                  whileHover={{ x: 2, transition: { duration: 0.12 } }}
                  className="glass rounded-xl p-4 flex items-start gap-4 hover:bg-white/[0.05] transition-colors duration-150 group"
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
                  <div className="flex items-center gap-1.5 flex-shrink-0 self-start">
                    <span className={`w-1.5 h-1.5 rounded-full ${getStatusDotColor(post.status)}`} />
                    <span className="text-[9px] text-white/20 px-1.5 py-0.5 rounded-full border border-white/[0.08]">
                      {post.status}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}
