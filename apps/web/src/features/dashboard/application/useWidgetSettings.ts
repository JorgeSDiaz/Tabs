import { useCallback, useEffect, useRef, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { getWidgets, putWidgets } from '../adapters/api/dashboard'
import type { WidgetID, WidgetSettings } from '../domain/widgets'

export function useWidgetSettings() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Every toggle PUTs the whole map, so saves must land in the order the
  // switches were flipped; chaining keeps the last flip authoritative.
  const saves = useRef<Promise<void>>(Promise.resolve())

  const load = useCallback(async () => {
    try {
      setSettings(await getWidgets())
      setError(null)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // next is built here, outside any state updater, so a StrictMode
  // double-invoke can never queue the same PUT twice.
  function toggle(id: WidgetID) {
    if (!settings) return
    const next: WidgetSettings = { ...settings, [id]: !settings[id] }
    setSettings(next)
    saves.current = saves.current.then(async () => {
      try {
        await putWidgets(next)
        setError(null)
      } catch (err) {
        // The server's truth won: resync so the switches show it.
        setError(errorMessage(err))
        await load()
      }
    })
  }

  return { settings, ready, error, toggle }
}
