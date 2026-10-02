import { Flame } from '../../../../shared/ui/Icon'
import { levelProgress, type Habit } from '../../domain/habit'

export function HabitHeader({ habit }: { habit: Habit | null }) {
  // Without a habit the header says nothing; the streak panel carries
  // the error state.
  if (!habit) return null
  const { streak, xp } = habit
  const percent = Math.round(levelProgress(xp) * 100)
  return (
    <div className="habit-header">
      <p className="header-pill habit-streak">
        <Flame size={16} />
        <strong>{streak.current}</strong>
        <span className="visually-hidden">day streak</span>
      </p>
      <div
        className="header-pill habit-level"
        role="progressbar"
        aria-label={`Level ${xp.level}`}
        aria-valuemin={xp.level_starts_at}
        aria-valuemax={xp.next_level_at}
        aria-valuenow={xp.total}
        aria-valuetext={`${xp.total} of ${xp.next_level_at} XP`}
      >
        <span>Level {xp.level}</span>
        <span className="level-track" aria-hidden="true">
          <span className="level-fill" style={{ width: `${percent}%` }} />
        </span>
        <span className="level-xp">{xp.total.toLocaleString('en-US')} XP</span>
      </div>
    </div>
  )
}
