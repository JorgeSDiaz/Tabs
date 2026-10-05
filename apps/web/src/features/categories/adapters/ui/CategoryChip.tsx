import { Icon } from '../../../../shared/ui/Icon'
import { GENERIC_ICON } from '../../domain/category'
import { inkFor } from '../../domain/categoryColors'
import { CATEGORY_ICONS } from './categoryIcons'

type Props = {
  // The category's stored icon name; one this app does not draw falls back
  // to the generic icon.
  icon: string
  color: string
  small?: boolean
}

// The marker a category carries wherever it appears: its icon on its
// color, the icon dark or light so it stays legible on either.
export function CategoryChip({ icon, color, small }: Props) {
  return (
    <span
      className={small ? 'category-chip small' : 'category-chip'}
      style={{ background: color, color: inkFor(color) }}
      aria-hidden="true"
    >
      <Icon size={small ? 16 : 20}>
        {CATEGORY_ICONS[icon] ?? CATEGORY_ICONS[GENERIC_ICON]}
      </Icon>
    </span>
  )
}
