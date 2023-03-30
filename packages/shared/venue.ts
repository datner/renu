import * as S from '@effect/schema/Schema'
import { Id as _Id } from './schema/common'
import { Common } from './schema'
import { pipe } from '@effect/data/Function'

export const Id = _Id('VenueId')
export type Id = S.To<typeof Id>

export const Identifier = pipe(S.string, S.fromBrand(Common.Slug), S.brand('VenueIdentifier'))
