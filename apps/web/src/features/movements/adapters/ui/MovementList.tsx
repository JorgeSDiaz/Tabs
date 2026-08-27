import type { Category } from '../../../categories/domain/category'
import { formatCents } from '../../../../shared/lib/money'
import type { Movement } from '../../domain/movement'

type Props = {
  movements: Movement[]
  categories: Category[]
  onDelete: (id: number) => Promise<void>
}

export function MovementList({ movements, categories, onDelete }: Props) {
  if (movements.length === 0) {
    return <p className="empty">No movements in this cycle yet.</p>
  }

  const names = new Map(categories.map((c) => [c.id, c.name]))
  return (
    <ul className="movement-list">
      {movements.map((m) => (
        <li key={m.id}>
          <span className="date">{m.occurred_on}</span>
          <span className="category">{names.get(m.category_id) ?? '—'}</span>
          <span className="note">{m.note}</span>
          <span className={m.direction === 'in' ? 'amount in' : 'amount out'}>
            {m.direction === 'in' ? '+' : '−'}
            {formatCents(m.amount_cents)}
          </span>
          <button type="button" onClick={() => void onDelete(m.id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  )
}
