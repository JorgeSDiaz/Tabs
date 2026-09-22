import { api } from '../../../../shared/api/client'
import type { WidgetSettings } from '../../domain/widgets'

export async function getWidgets(): Promise<WidgetSettings> {
  const { data, error } = await api.GET('/api/v1/dashboard/widgets')
  if (error) throw new Error(error.error)
  return data.widgets
}

export async function putWidgets(widgets: WidgetSettings): Promise<WidgetSettings> {
  const { data, error } = await api.PUT('/api/v1/dashboard/widgets', {
    body: { widgets },
  })
  if (error) throw new Error(error.error)
  return data.widgets
}
