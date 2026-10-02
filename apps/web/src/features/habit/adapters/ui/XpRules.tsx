import type { Habit } from '../../domain/habit'

// The XP explanation at the ledger's foot, built only from the rules the
// API returns. Without a habit it says nothing.
export function XpRules({ habit }: { habit: Habit | null }) {
  if (!habit) return null
  return (
    <p className="xp-rules">
      XP rewards logging, never amounts:{' '}
      {habit.rules.map((r, i) => (
        <span key={r.id}>
          {i > 0 && ' · '}
          {r.label} +{r.xp}
        </span>
      ))}
      .
    </p>
  )
}
