import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Schema from "@effect/schema/Schema";
import db from "db";
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
export type GetVenueClearingProviderFrom = Schema.From<typeof GetVenueClearingProvider>;

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
