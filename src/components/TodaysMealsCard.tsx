'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sunrise, Sun, Moon, UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'

type Slot = { id: string; name: string; isActive: boolean }

function getTodayBD(): string {
  // Must use Bangladesh timezone — server is UTC, Bangladesh is UTC+6
  // Using new Date().toISOString() would give wrong date at night
  const bd = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
  )
  const y = bd.getFullYear()
  const m = String(bd.getMonth() + 1).padStart(2, '0')
  const d = String(bd.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getDisplayDate(): string {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })
  ).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    timeZone: 'Asia/Dhaka',
  })
}

function getMealIcon(name: string) {
  const l = name.toLowerCase()
  if (l.includes('breakfast') || l.includes('morning') || l.includes('sahri'))
    return <Sunrise className="w-5 h-5" />
  if (l.includes('lunch') || l.includes('afternoon'))
    return <Sun className="w-5 h-5" />
  if (l.includes('dinner') || l.includes('evening') || l.includes('night'))
    return <Moon className="w-5 h-5" />
  return <UtensilsCrossed className="w-5 h-5" />
}

export default function TodaysMealsCard() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dateStr = getTodayBD()
    fetch(`/api/student/today-meals?date=${dateStr}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setSlots(data.slots ?? [])
      })
      .catch(() => setError('Failed to load meal data'))
      .finally(() => setLoading(false))
  }, [])

  const activeCount = slots.filter(s => s.isActive).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-heading font-semibold text-text-primary">
          Today&apos;s Meals
        </h2>
        <span className="text-xs text-text-secondary">{getDisplayDate()}</span>
      </div>

      <div className="bg-surface rounded-2xl border border-border/50 shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-border/30">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary animate-pulse" />
                  <div className="w-20 h-4 bg-surface-secondary rounded animate-pulse" />
                </div>
                <div className="w-20 h-6 bg-surface-secondary rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-sm text-danger">{error}</div>
        ) : (
          <div className="divide-y divide-border/30">
            {slots.map(slot => (
              <div
                key={slot.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-secondary flex items-center justify-center text-text-secondary">
                    {getMealIcon(slot.name)}
                  </div>
                  <span className="font-semibold text-text-primary text-sm">
                    {slot.name}
                  </span>
                </div>
                {slot.isActive ? (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-success/10 text-success">
                    ✓ Active
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-surface-secondary text-text-secondary">
                    Not selected
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-surface-secondary/50">
            <span className="text-xs text-text-secondary">
              {activeCount} of {slots.length} meals active today
            </span>
            <Link
              href="/student/meal-selection"
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              → Manage selections
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}
