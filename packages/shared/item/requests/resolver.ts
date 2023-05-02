import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import { inspect } from "util";
import { Database } from "../../Database";
import { filterRequestsByTag, resolveBatch, resolveSingle } from "../../effect/Request";
import { GetItemById, GetItemByIdError } from "./getById";
import { GetItemByIdentifier, GetItemByIdentifierError } from "./getByIdentifier";
import { GetItemsByVenue } from "./getByVenue";
import { GetItemContent } from "./getContent";
import { GetItemModifierById, GetItemModifierByIdError } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";

type ItemRequest =
  | GetItemById
  | GetItemByIdentifier
  | GetItemContent
  | GetItemModifiers
  | GetItemModifierById
  | GetItemsByVenue;

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
        filterRequestsByTag(requests, "GetItemsByVenue"),
        (reqs, db) =>
          db.item.findMany({
            where: { venueId: { in: reqs.map(req => req.venueId) } },
            orderBy: { venueId: "asc" },
          }),
        r => String(`${r.venueId}-${r.orgId}`),
        d => String(`${d.venueId}-${d.organizationId}`),
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
            where: { id: { in: reqs.map(_ => _.id) } },
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
        filterRequestsByTag(requests, "GetItemModifierById"),
        (reqs, db) =>
          db.itemModifier.findMany({
            where: { id: { in: reqs.map(_ => _.id) } },
          }),
        (req, modifiers) =>
          Option.match(
            A.findFirst(modifiers, _ => _.id === req.id),
            () => Exit.fail(new GetItemModifierByIdError()),
            Exit.succeed,
          ),
      ),
      pipe(
        Effect.flatMap(Database, db =>
          Effect.promise(
            () =>
              db.item.findMany({
                where: {
                  OR: [
                    { id: { in: filterRequestsByTag(requests, "GetItemById").map(_ => _.id) } },
                    { identifier: { in: filterRequestsByTag(requests, "GetItemByIdentifier").map(_ => _.identifier) } },
                  ],
                  deleted: null,
                },
              }),
          )),
        Effect.flatMap(items =>
          Effect.allPar(
            Effect.forEachPar(filterRequestsByTag(requests, "GetItemById"), req =>
              Request.complete(
                req,
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
              )),
            Effect.forEachPar(filterRequestsByTag(requests, "GetItemByIdentifier"), req =>
              Request.complete(
                req,
                Option.match(
                  A.findFirst(items, _ => {
                    if (Option.isSome(req.venueId)) {
                      return _.identifier === req.identifier && _.venueId === req.venueId.value;
                    }

                    return _.identifier === req.identifier;
                  }),
                  () => Exit.fail(new GetItemByIdentifierError()),
                  Exit.succeed,
                ),
              )),
          )
        ),
      ),
    )
  ),
  RequestResolver.contextFromServices(Database),
);

const getByIds = A.filterMap(
  (_: ItemRequest) => _._tag === "GetItemById" ? Option.some(_) : Option.none(),
);
