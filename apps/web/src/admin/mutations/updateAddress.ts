import { resolver } from "@blitzjs/rpc";
import { pipe } from "@effect/data/Function";
import * as S from "@effect/data/String";
import * as Effect from "@effect/io/Effect";
import { GlobalRole } from "database";
import db from "db";
import { Settings } from "src/admin/validations/settings";
import { setDefaultVenue } from "src/auth/helpers/setDefaultVenue";
import { Renu } from "src/core/effect";
import { prismaError } from "src/core/helpers/prisma";

const removeDashes = S.replace("-", "");
const isCell = S.startsWith("05");

const toPhoneNumber = (phone: string) =>
  pipe(phone, removeDashes, (p) => [p.slice(0, isCell(p) ? 3 : 2), "-", p.slice(isCell(p) ? 3 : 2)].join(""));

export default resolver.pipe(
  resolver.zod(Settings),
  resolver.authorize([GlobalRole.ADMIN, GlobalRole.SUPER]),
  setDefaultVenue,
  ({ phone, address, venue }) =>
    Renu.runPromise$(
      Effect.tryPromise({
        try: () =>
          db.venue.update({
            where: { id: venue.id },
            data: { simpleContactInfo: `${address} - ${toPhoneNumber(phone)}` },
          }),
        catch: prismaError("Venue"),
      }),
    ),
);
