import { useCategories } from '../features/categories/application/useCategories'
import { CycleSummary } from '../features/cycles/adapters/ui/CycleSummary'
import { useCurrentCycle } from '../features/cycles/application/useCurrentCycle'
import { WidgetPicker } from '../features/dashboard/adapters/ui/WidgetPicker'
import { WidgetSection } from '../features/dashboard/adapters/ui/WidgetSection'
import { useWidgetSettings } from '../features/dashboard/application/useWidgetSettings'
import {
  deleteMovement,
  recordMovement,
} from '../features/movements/adapters/api/movements'
import { MovementForm } from '../features/movements/adapters/ui/MovementForm'
import { MovementList } from '../features/movements/adapters/ui/MovementList'
import { useMovements } from '../features/movements/application/useMovements'
import type { MovementInput } from '../features/movements/domain/movement'

function App() {
  const {
    categories,
    error: categoriesError,
    create: createCategory,
  } = useCategories()
  const { cycle, error: cycleError, reload: reloadCycle } = useCurrentCycle()
  const {
    movements,
    error: movementsError,
    reload: reloadMovements,
  } = useMovements()
  const {
    settings,
    ready: widgetsReady,
    error: settingsError,
    toggle,
  } = useWidgetSettings()

  async function refresh() {
    await Promise.all([reloadMovements(), reloadCycle()])
  }

  async function handleSubmit(input: MovementInput) {
    await recordMovement(input)
    await refresh()
  }

  async function handleDelete(id: number) {
    await deleteMovement(id)
    await refresh()
  }

  const error = categoriesError ?? cycleError ?? movementsError ?? settingsError

  return (
    <main className="screen">
      <h1>Tabs</h1>
      {error && <p className="error">{error}</p>}
      {/* Pinned first: recording never depends on widget state. */}
      <MovementForm
        categories={categories}
        onSubmit={handleSubmit}
        onCreateCategory={createCategory}
      />
      {cycle && <CycleSummary cycle={cycle} />}
      <WidgetPicker settings={settings} onToggle={toggle} />
      <WidgetSection
        ready={widgetsReady}
        settings={settings}
        cycle={cycle}
        movements={movements}
        categories={categories}
      />
      <MovementList
        movements={movements}
        categories={categories}
        onDelete={handleDelete}
      />
    </main>
  )
}

export default App
