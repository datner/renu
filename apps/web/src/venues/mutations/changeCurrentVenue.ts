import { resolver } from "@blitzjs/rpc";
import db from "db";
import { pipe } from "fp-ts/lib/function";
import * as TE from "fp-ts/TaskEither";
import { setDefaultOrganizationId } from "src/auth/helpers/setDefaultOrganizationId";
import { prismaNotFound } from "src/core/helpers/prisma";
import { z } from "zod";

const ChangeVenue = z.number();

export default resolver.pipe(
  resolver.zod(ChangeVenue),
  resolver.authorize(),
  (id) => ({ id }),
  setDefaultOrganizationId,
  (where, ctx) =>
    pipe(
      TE.tryCatch(() => db.venue.findFirstOrThrow({ where }), prismaNotFound),
      TE.chainTaskK((venue) => () => ctx.session.$setPublicData({ venue: venue })),
    )(),
);
