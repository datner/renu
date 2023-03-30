import { resolver } from "@blitzjs/rpc";
import * as Schema from "@effect/schema/Schema";
import { Common } from "shared/schema";
import db from "db";
import { selectTheEntireMenu } from "../prisma";

const GetMenu = Schema.struct({
  identifier: Common.Slug
});

export default resolver.pipe(
  (i: Schema.From<typeof GetMenu>) => Schema.decode(GetMenu)(i),
  (where) =>
    db.venue.findUniqueOrThrow({
      where,
      select: selectTheEntireMenu,
    }),
);
