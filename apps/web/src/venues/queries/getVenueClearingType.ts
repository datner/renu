import { pipe } from "@effect/data/Function";
import * as Schema from "@effect/schema/Schema";
import db from "db";
import * as Effect from "effect/Effect";
import { Venue } from "shared";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

const FromId = Schema.struct({
  id: Venue.Id,
});
const FromIdentifier = Schema.struct({
  identifier: Venue.Identifier,
});

const GetVenueClearingProvider = Schema.union(
  FromId,
  FromIdentifier,
);
export type GetVenueClearingProviderFrom = Schema.Schema.From<typeof GetVenueClearingProvider>;

const getVenueClearingProvider = (input: GetVenueClearingProviderFrom) =>
  pipe(
    Schema.parse(GetVenueClearingProvider)(input),
    Effect.flatMap((whereVenue) =>
      Effect.tryPromise({
        try: () => db.clearingIntegration.findFirstOrThrow({ where: { Venue: whereVenue } }),
        catch: prismaError("ClearingIntegration"),
      })
    ),
    Effect.map((c) => c.provider),
    Renu.runPromise$,
  );

export default getVenueClearingProvider;
