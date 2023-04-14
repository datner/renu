import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import { Prisma } from "database";
import * as ModifierConfig from "../modifier-config";
import * as Common from "../schema/common";
import * as Number from "../schema/number";
import * as Item from "./item";

export const Id = Common.Id("ItemModifierId");
export type Id = S.To<typeof Id>;

const PrismaJson = S.json as S.Schema<Prisma.JsonValue, S.Json>;

export const Schema = S.struct({
  id: Id,
  position: Number.NonNegativeInt,
  itemId: Item.Id,
  deleted: S.optionFromNullable(S.date),
  config: ModifierConfig.Schema,
  managementRepresentation: PrismaJson,
});

export const FromPrisma = pipe(
  Schema,
  S.omit("config"),
  S.extend(S.struct({
    config: ModifierConfig.FromPrisma,
  })),
);

export const fromProvider =
  <A extends S.Schema<Prisma.JsonValue, any>>(managementRepresentation: A) => (schema: typeof FromPrisma) =>
    pipe(
      schema,
      S.omit("managementRepresentation"),
      S.extend(S.struct({ managementRepresentation })),
    );
