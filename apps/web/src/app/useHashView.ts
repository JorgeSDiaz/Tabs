import { useSyncExternalStore } from 'react'

export type View = 'dashboard' | 'categories'

// The two addresses of the app. A view is a URL hash, so a reload stays on
// it and the browser's back control leaves it.
export const DASHBOARD_HREF = '#/'
export const CATEGORIES_HREF = '#/categories'

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

// Anything that is not the categories address is the dashboard.
export function useHashView(): View {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return hash === CATEGORIES_HREF ? 'categories' : 'dashboard'
}
