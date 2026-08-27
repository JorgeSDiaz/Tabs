import type { components } from '../../../shared/api/schema'

export type Movement = components['schemas']['Movement']
export type MovementInput = components['schemas']['MovementInput']
export type Direction = Movement['direction']
