import type * as S from '@effect/schema/Schema'
import { Id as _Id } from './schema/common'

export const Id = _Id('VenueId')
export type Id = S.To<typeof Id>
