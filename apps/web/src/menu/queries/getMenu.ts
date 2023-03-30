import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import db from "db";
import { Common } from "shared/schema";
import { selectTheEntireMenu } from "../prisma";

const GetMenu = Schema.struct({
  identifier: Common.Slug,
});

export default resolver.pipe(
  (i: Schema.From<typeof GetMenu>) => Schema.decode(GetMenu)(i),
  (where) =>
    db.venue.findUniqueOrThrow({
      where,
      select: selectTheEntireMenu,
    }),
);
