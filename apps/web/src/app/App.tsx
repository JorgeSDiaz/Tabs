import { useEffect, useMemo, useRef, useState } from 'react'
import { CategoriesScreen } from '../features/categories/adapters/ui/CategoriesScreen'
import { categoryColors } from '../features/categories/domain/categoryColors'
import { useCategories } from '../features/categories/application/useCategories'
import { useCurrentCycle } from '../features/cycles/application/useCurrentCycle'
import { cycleLabel } from '../features/cycles/domain/cycleLabel'
import { WidgetPicker } from '../features/dashboard/adapters/ui/WidgetPicker'
import { WidgetSection } from '../features/dashboard/adapters/ui/WidgetSection'
import { useWidgetSettings } from '../features/dashboard/application/useWidgetSettings'
import {
  deleteMovement,
  recordMovement,
  updateMovement,
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
import { Icon, TAG } from '../shared/ui/Icon'
import { CATEGORIES_HREF, DASHBOARD_HREF, useHashView } from './useHashView'

function App() {
  const {
    categories,
    error: categoriesError,
    create: createCategory,
    update: updateCategory,
    remove: removeCategory,
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
    page,
    totalPages,
    total: movementsTotal,
    error: movementsError,
    goToPage,
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

  // Both views stay mounted, so the entry form keeps what was typed into
  // it across a visit to the categories. Showing one moves focus into it:
  // the link that was activated is now in the hidden one.
  const view = useHashView()
  const dashboardRef = useRef<HTMLElement>(null)
  const categoriesRef = useRef<HTMLElement>(null)
  const shownView = useRef(view)
  useEffect(() => {
    if (shownView.current === view) return
    shownView.current = view
    const shown = view === 'categories' ? categoriesRef : dashboardRef
    shown.current?.focus()
  }, [view])

  // What every write can change besides the ledger's own page.
  function reloadSummaries() {
    reloadCycle()
    reloadHabit()
  }

  // The first page is where a movement dated today lands.
  async function handleSubmit(input: MovementInput) {
    const saved = await recordMovement(input)
    setSavedId(saved?.id ?? null)
    goToPage(1)
    reloadSummaries()
  }

  // Leaves savedId alone: the entry form's confirmation keeps describing the
  // last recorded movement. The ledger stays on its page; when the edit took
  // that page's last row away, the server answers with the last page.
  async function handleEdit(id: number, input: MovementInput) {
    await updateMovement(id, input)
    reloadMovements()
    reloadSummaries()
  }

  async function handleDelete(id: number) {
    await deleteMovement(id)
    reloadMovements()
    reloadSummaries()
  }

  // Each category's own color, shared by the chart, the ledger and the
  // form. An edit on the categories screen changes this list, so the
  // dashboard is current the moment it is shown again.
  const colors = useMemo(() => categoryColors(categories), [categories])

  const error = categoriesError ?? cycleError ?? movementsError ?? settingsError
  const label = cycle && cycleLabel(cycle, today())
  // The active cycle as the calendars tint it, in the form and the dialog.
  const cycleSpan =
    cycle && label
      ? {
          starts_on: cycle.starts_on,
          ends_on: cycle.ends_on,
          range: label.range,
        }
      : undefined

  return (
    <>
      <main
        ref={dashboardRef}
        className="screen"
        hidden={view !== 'dashboard'}
        tabIndex={-1}
      >
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
            <a className="header-link" href={CATEGORIES_HREF}>
              <Icon>{TAG}</Icon>
              Categories
            </a>
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
          cycle={cycleSpan}
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
            ready={widgetsReady && !categoriesLoading}
            settings={settings}
            cycle={cycle}
            categories={categories}
            colors={colors}
            dataError={cycleError ?? categoriesError}
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
            page={page}
            totalPages={totalPages}
            total={movementsTotal}
            onPage={goToPage}
            categories={categories}
            colors={colors}
            onEdit={handleEdit}
            onDelete={handleDelete}
            cycle={cycleSpan}
            loading={movementsLoading}
            ready={movementsReady}
            error={movementsError}
            xpById={xpById}
            footer={<XpRules habit={habit} />}
          />
        </div>
      </main>
      <CategoriesScreen
        ref={categoriesRef}
        hidden={view !== 'categories'}
        dashboardHref={DASHBOARD_HREF}
        categories={categories}
        loading={categoriesLoading}
        error={categoriesError}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onRemove={removeCategory}
      />
    </>
  )
}

export default App
