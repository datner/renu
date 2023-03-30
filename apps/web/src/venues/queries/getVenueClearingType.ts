import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import { pipe } from "@effect/data/Function";
import { Venue } from "shared";
import { prismaError } from "src/core/helpers/prisma";
import { Renu } from "src/core/effect";
import db from "db";

const FromId = Schema.struct({
  id: Venue.Id,
});
const FromIdentifier = Schema.struct({
  identifier: Venue.Identifier,
});

const GetVenueClearingProvider = Schema.union(
 FromId,
  FromIdentifier
)
export type GetVenueClearingProviderFrom = Schema.From<typeof GetVenueClearingProvider>

const getVenueClearingProvider = (input: GetVenueClearingProviderFrom) =>
  pipe(
    Schema.parseEffect(GetVenueClearingProvider)(input),
    Effect.flatMap((whereVenue) =>
      Effect.attemptCatchPromise(
        () =>
          db.clearingIntegration.findFirstOrThrow({ where: { Venue: whereVenue } }),
        prismaError("ClearingIntegration"),
      )
    ),
    Effect.map((c) => c.provider),
    Renu.runPromise$
  );

export default getVenueClearingProvider
