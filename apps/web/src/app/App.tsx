import { useCategories } from '../features/categories/application/useCategories'
import { CycleSummary } from '../features/cycles/adapters/ui/CycleSummary'
import { useCurrentCycle } from '../features/cycles/application/useCurrentCycle'
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

  const error = categoriesError ?? cycleError ?? movementsError

  return (
    <main className="screen">
      <h1>Tabs</h1>
      {error && <p className="error">{error}</p>}
      {cycle && <CycleSummary cycle={cycle} />}
      <MovementForm
        categories={categories}
        onSubmit={handleSubmit}
        onCreateCategory={createCategory}
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
