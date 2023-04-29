import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { Database } from "../Database";
import { accessing } from "../effect/Context";
import * as Item from "./item";
import * as Modifier from "./modifier";
import * as Requests from "./requests";

export const fromId = Schema.transformResult(
  Schema.from(Item.Id),
  Item.Item,
  (i) =>
    pipe(
      Requests.getById(i),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  it => ParseResult.success(it.id),
);

export const modifierFromId = Schema.transformResult(
  Schema.from(Modifier.Id),
  Modifier.fromPrisma,
  (i) =>
    pipe(
      Requests.getModifierById(i),
      Effect.mapError(_ => ParseResult.parseError([ParseResult.missing])),
      accessing(Database),
    ),
  it => ParseResult.success(it.id),
);

