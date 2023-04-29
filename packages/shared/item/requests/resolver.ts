import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as RequestResolver from "@effect/io/RequestResolver";
import { inspect } from "util";
import { Database } from "../../Database";
import { resolveBatch, resolveSingle } from "../../effect/Request";
import { GetItemById, GetItemByIdError } from "./getById";
import { GetItemContent } from "./getContent";
import { GetItemModifierById, GetItemModifierByIdError } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";

type ItemRequest = GetItemById | GetItemContent | GetItemModifiers | GetItemModifierById;

export const ItemResolver = pipe(
  RequestResolver.makeBatched((
    requests: ItemRequest[],
  ) =>
    Effect.allPar(
      Effect.sync(() => console.log(inspect(requests.map(r => r._tag), false, null, true))),
      resolveBatch(
        A.filter(requests, (_): _ is GetItemModifiers => _._tag === "GetItemModifiers"),
        (reqs, db) =>
          db.itemModifier.findMany({
            where: { itemId: { in: reqs.map(req => req.id) }, deleted: null },
            orderBy: { itemId: "asc" },
          }),
        r => String(r.id),
        d => String(d.itemId),
      ),
      resolveBatch(
        A.filter(requests, (_): _ is GetItemContent => _._tag === "GetItemContent"),
        (reqs, db) =>
          db.itemI18L.findMany({
            where: { itemId: { in: reqs.map(req => req.id) } },
            orderBy: { itemId: "asc" },
          }),
        r => String(r.id),
        d => String(d.itemId),
      ),
      resolveSingle(
        getByIds(requests),
        (reqs, db) =>
          db.item.findMany({
            where: idIn(reqs),
          }),
        (req, items) =>
          Option.match(
            A.findFirst(items, _ => {
              if (Option.isSome(req.venueId)) {
                return _.id === req.id && _.venueId === req.venueId.value;
              }

              return _.id === req.id;
            }),
            () => Exit.fail(new GetItemByIdError()),
            Exit.succeed,
          ),
      ),
      resolveSingle(
        A.filter(requests, (_): _ is GetItemModifierById => _._tag === "GetItemModifierById"),
        (reqs, db) =>
          db.itemModifier.findMany({
            where: idIn(reqs),
          }),
        (req, modifiers) =>
          Option.match(
            A.findFirst(modifiers, _ => _.id === req.id),
            () => Exit.fail(new GetItemModifierByIdError()),
            Exit.succeed,
          ),
      ),
    )
  ),
  RequestResolver.contextFromServices(Database),
);

const getByIds = A.filterMap(
  (_: ItemRequest) => _._tag === "GetItemById" ? Option.some(_) : Option.none(),
);

const idIn = (reqs: ItemRequest[]) => ({
  id: {
    in: A.map(reqs, _ => _.id),
  },
} as const);
