'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface LocationScheduleFormProps {
  locationId: string
  initialIntervalDays: number
  initialDaysOfWeek: number[] | null
  initialHour: number
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function LocationScheduleForm({
  locationId,
  initialIntervalDays,
  initialDaysOfWeek,
  initialHour,
}: LocationScheduleFormProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'interval' | 'days'>(initialDaysOfWeek && initialDaysOfWeek.length > 0 ? 'days' : 'interval')
  const [intervalDays, setIntervalDays] = useState(initialIntervalDays ?? 7)
  const [selectedDays, setSelectedDays] = useState<number[]>(initialDaysOfWeek ?? [1])
  const [hour, setHour] = useState(initialHour ?? 9)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const payload =
        mode === 'interval'
          ? { generation_interval_days: intervalDays, posting_days_of_week: null, posting_hour: hour }
          : { generation_interval_days: 7, posting_days_of_week: selectedDays, posting_hour: hour }

      const res = await fetch(`/api/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        throw new Error(data.error ?? 'Failed to save')
      }
      router.refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-5 pt-4 border-t border-white/[0.06] space-y-4">
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest">Posting Schedule</p>

      {/* Mode toggle */}
      <div className="flex gap-2">
        {(['interval', 'days'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === m
                ? 'bg-white/10 text-white/80 border border-white/15'
                : 'text-white/30 hover:text-white/50 hover:bg-white/[0.04]'
            }`}
          >
            {m === 'interval' ? 'Every N days' : 'Days of week'}
          </button>
        ))}
      </div>

      {mode === 'interval' ? (
        <div className="flex items-center gap-3">
          <label className="text-xs text-white/40">Post every</label>
          <input
            type="number"
            min={1}
            max={365}
            value={intervalDays}
            onChange={(e) => setIntervalDays(Number(e.target.value))}
            className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/70 text-sm text-center focus:outline-none focus:border-white/20 [appearance:textfield]"
          />
          <label className="text-xs text-white/40">days</label>
        </div>
      ) : (
        <div className="flex gap-1.5">
          {DAY_LABELS.map((label, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => toggleDay(idx)}
              className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${
                selectedDays.includes(idx)
                  ? 'bg-white/15 text-white/90 border border-white/20'
                  : 'bg-white/[0.03] text-white/25 border border-white/[0.06] hover:border-white/15 hover:text-white/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Hour picker */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-white/40">at</label>
        <input
          type="number"
          min={0}
          max={23}
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="w-20 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-white/70 text-sm text-center focus:outline-none focus:border-white/20 [appearance:textfield]"
        />
        <label className="text-xs text-white/40">:00 (24h)</label>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || (mode === 'days' && selectedDays.length === 0)}
        className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed bg-white/[0.07] text-white/70 hover:bg-white/[0.12] hover:text-white/90 border border-white/[0.1]"
      >
        {saving ? (
          <>
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Saving…
          </>
        ) : saved ? (
          <>
            <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Saved
          </>
        ) : (
          'Save Schedule'
        )}
      </button>
    </div>
  )
}
