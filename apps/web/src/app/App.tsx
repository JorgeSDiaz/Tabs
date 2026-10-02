import { useMemo, useState } from 'react'
import { categoryColors } from '../features/categories/domain/categoryColors'
import { useCategories } from '../features/categories/application/useCategories'
import { useCurrentCycle } from '../features/cycles/application/useCurrentCycle'
import { cycleLabel } from '../features/cycles/domain/cycleLabel'
import { WidgetPicker } from '../features/dashboard/adapters/ui/WidgetPicker'
import { WidgetSection } from '../features/dashboard/adapters/ui/WidgetSection'
import { useWidgetSettings } from '../features/dashboard/application/useWidgetSettings'
import { sumByCategory } from '../features/dashboard/domain/widgets'
import {
  deleteMovement,
  recordMovement,
} from '../features/movements/adapters/api/movements'
import { MovementForm } from '../features/movements/adapters/ui/MovementForm'
import { MovementList } from '../features/movements/adapters/ui/MovementList'
import { useMovements } from '../features/movements/application/useMovements'
import { HabitHeader } from '../features/habit/adapters/ui/HabitHeader'
import { StreakPanel } from '../features/habit/adapters/ui/StreakPanel'
import { XpRules } from '../features/habit/adapters/ui/XpRules'
import { useHabit } from '../features/habit/application/useHabit'
import { xpByMovement } from '../features/habit/domain/habit'
import type { MovementInput } from '../features/movements/domain/movement'
import { today } from '../shared/lib/money'

function App() {
  const {
    categories,
    error: categoriesError,
    create: createCategory,
    loading: categoriesLoading,
  } = useCategories()
  const {
    cycle,
    error: cycleError,
    reload: reloadCycle,
    loading: cycleLoading,
  } = useCurrentCycle()
  const {
    movements,
    error: movementsError,
    reload: reloadMovements,
    loading: movementsLoading,
    ready: movementsReady,
  } = useMovements()
  const {
    settings,
    ready: widgetsReady,
    error: settingsError,
    toggle,
  } = useWidgetSettings()

  const { habit, error: habitError, reload: reloadHabit, loading: habitLoading } =
    useHabit()
  const [savedId, setSavedId] = useState<number | null>(null)
  const xpById = useMemo(() => xpByMovement(habit), [habit])

  async function refresh() {
    await Promise.all([reloadMovements(), reloadCycle(), reloadHabit()])
  }

  async function handleSubmit(input: MovementInput) {
    const saved = await recordMovement(input)
    setSavedId(saved?.id ?? null)
    await refresh()
  }

  async function handleDelete(id: number) {
    await deleteMovement(id)
    await refresh()
  }

  // One color per category, shared by the chart, the ledger and the form.
  const colors = useMemo(
    () => categoryColors(sumByCategory(movements, categories)),
    [movements, categories],
  )

  const error = categoriesError ?? cycleError ?? movementsError ?? settingsError
  const label = cycle && cycleLabel(cycle, today())

  return (
    <main className="screen">
      <header className="page-header">
        <h1 className="brand">tabs</h1>
        <p className="cycle-label">
          {label ? (
            <>
              <strong>
                Day {label.day} of {label.length}
              </strong>{' '}
              <span>{label.range}</span>
            </>
          ) : cycleLoading ? (
            'Loading cycle…'
          ) : (
            'Cycle unavailable'
          )}
        </p>
        <div className="header-tools">
          <HabitHeader habit={habit} />
          <WidgetPicker settings={settings} onToggle={toggle} />
        </div>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {/* Pinned first: recording never depends on widget state. */}
      <MovementForm
        categories={categories}
        colors={colors}
        onSubmit={handleSubmit}
        onCreateCategory={createCategory}
        categoriesLoading={categoriesLoading}
        savedXp={savedId === null ? undefined : xpById.get(savedId)}
        cycle={
          cycle && label
            ? {
                starts_on: cycle.starts_on,
                ends_on: cycle.ends_on,
                range: label.range,
              }
            : undefined
        }
      />
      <div className="dashboard">
        <WidgetSection
          streak={
            <StreakPanel
              habit={habit}
              error={habitError}
              loading={habitLoading}
            />
          }
          ready={widgetsReady && movementsReady && !categoriesLoading}
          settings={settings}
          cycle={cycle}
          movements={movements}
          categories={categories}
          colors={colors}
          dataError={movementsError ?? categoriesError}
          unavailable={
            settingsError && !settings
              ? 'Your widgets could not be loaded.'
              : cycleError && !cycle
                ? 'Analytics are unavailable until the cycle loads.'
                : null
          }
        />
        <MovementList
          movements={movements}
          categories={categories}
          colors={colors}
          onDelete={handleDelete}
          loading={movementsLoading}
          ready={movementsReady}
          error={movementsError}
          xpById={xpById}
          footer={<XpRules habit={habit} />}
        />
      </div>
    </main>
  )
}

export default App
