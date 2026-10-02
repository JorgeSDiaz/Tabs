import { Flame } from '../../../../shared/ui/Icon'
import type { DayStatus, Habit } from '../../domain/habit'

type Props = {
  habit: Habit | null
  error: string | null
  loading: boolean
}

const STATUS_LABEL: Record<DayStatus, string> = {
  logged: 'logged',
  missed: 'missed',
  today_logged: 'today, logged',
  today_pending: 'today, not logged yet',
  ahead: 'still ahead',
}

// "2026-09-28" as a short local day, without a timezone shift.
function day(isoDate: string): string {
  const [year, month, date] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function title(streak: number): string {
  if (streak === 0) return 'No streak yet'
  return `${streak}-day streak`
}

function caption(habit: Habit): string {
  const { current, today_logged } = habit.streak
  if (today_logged) return 'You logged today. Nicely done.'
  return current > 0
    ? 'Log a movement today to keep it going.'
    : 'Log a movement today to start one.'
}

export function StreakPanel({ habit, error, loading }: Props) {
  return (
    <section
      className="streak-panel"
      aria-label="Logging streak"
      aria-busy={loading}
    >
      {!habit ? (
        error ? (
          <p className="streak-message" role="alert">
            Your logging streak is unavailable: {error}
          </p>
        ) : (
          <p className="streak-message" role="status">
            Loading your streak…
          </p>
        )
      ) : (
        <>
          <div className="streak-heading">
            <Flame size={52} core />
            <div>
              <h2>{title(habit.streak.current)}</h2>
              <p>{caption(habit)}</p>
            </div>
          </div>
          <ul className="day-map" aria-label="Days of this cycle">
            {habit.days.map((d) => (
              <li
                key={d.date}
                className={`day ${d.status}`}
                aria-label={`${day(d.date)}: ${STATUS_LABEL[d.status]}`}
                title={`${day(d.date)} · ${STATUS_LABEL[d.status]}`}
              />
            ))}
          </ul>
          <ul className="day-legend" aria-label="Legend">
            <li>
              <span className="day logged" aria-hidden="true" /> Logged
            </li>
            <li>
              <span className="day today_logged" aria-hidden="true" /> Today
            </li>
            <li>
              <span className="day missed" aria-hidden="true" /> Missed
            </li>
            <li>
              <span className="day ahead" aria-hidden="true" /> Still ahead
            </li>
          </ul>
        </>
      )}
    </section>
  )
}
