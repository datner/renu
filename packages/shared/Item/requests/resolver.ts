import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Match from "@effect/match";
import * as Schema from "@effect/schema/Schema";
import { inspect } from "util";
import { Database } from "../../Database";
import { filterRequestsByTag, resolveBatch, resolveSingle } from "../../effect/Request";
import * as ModifierConfig from "../../modifier-config";
import { GetItemById, GetItemByIdError } from "./getById";
import { GetItemByIdentifier, GetItemByIdentifierError } from "./getByIdentifier";
import { GetItemsByVenue } from "./getByVenue";
import { GetItemContent } from "./getContent";
import { GetItemModifierById, GetItemModifierByIdError } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";
import { SetModifierConfig, SetModifierConfigError } from "./setModifierConfig";
import { SetPrestoId, SetPrestoIdError } from "./setPrestoId";

type ItemRequest =
  | GetItemById
  | GetItemByIdentifier
  | GetItemContent
  | GetItemModifiers
  | GetItemModifierById
  | GetItemsByVenue
  | SetModifierConfig
  | SetPrestoId;

export const ItemResolver = pipe(
  RequestResolver.makeBatched((
    requests: ItemRequest[],
  ) =>
    Effect.all(
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
            where: { venueId: { in: reqs.map(req => req.venueId) }, deleted: null },
            orderBy: { venueId: "asc" },
          }),
        r => String(`${r.venueId}-${r.orgId}`),
        d => String(`${d.venueId}-${d.organizationId}`),
      ),
      resolveBatch(
        filterRequestsByTag(requests, "GetItemContent"),
        (reqs, db) =>
          db.itemI18L.findMany({
            where: { itemId: { in: reqs.map(req => req.id) } },
            orderBy: { itemId: "asc" },
          }),
        r => String(r.id),
        d => String(d.itemId),
      ),
      resolveSingle(
        A.appendAll(
          filterRequestsByTag(requests, "GetItemByIdentifier"),
          filterRequestsByTag(requests, "GetItemById"),
        ),
        (reqs, db) =>
          db.item.findMany({
            where: {
              OR: [
                { id: { in: filterRequestsByTag(reqs, "GetItemById").map(_ => _.id) } },
                { identifier: { in: filterRequestsByTag(reqs, "GetItemByIdentifier").map(_ => _.identifier) } },
              ],
            },
          }),
        (req, items) =>
          pipe(
            Match.value(req),
            Match.tag("GetItemById", _ =>
              Option.match(
                A.findFirst(items, it => {
                  if (Option.isSome(_.venueId)) {
                    return _.id === it.id && it.venueId === _.venueId.value;
                  }
                  return _.id === it.id;
                }),
                {
                  onNone: () =>
                    Exit.fail(req._tag === "GetItemById" ? new GetItemByIdError() : new GetItemByIdentifierError()),
                  onSome: Exit.succeed,
                },
              )),
            Match.tag("GetItemByIdentifier", _ =>
              Option.match(
                A.findFirst(items, it => {
                  if (Option.isSome(_.venueId)) {
                    return _.identifier === it.identifier && it.venueId === _.venueId.value;
                  }

                  return _.identifier === it.identifier;
                }),
                {
                  onNone: () =>
                    Exit.fail(req._tag === "GetItemById" ? new GetItemByIdError() : new GetItemByIdentifierError()),
                  onSome: Exit.succeed,
                },
              )),
            Match.exhaustive,
          ) as any,
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
            {
              onNone: () => Exit.fail(new GetItemModifierByIdError()),
              onSome: Exit.succeed,
            },
          ),
      ),
      pipe(
        filterRequestsByTag(requests, "SetPrestoId"),
        Effect.forEach(req =>
          Request.completeEffect(
            req,
            pipe(
              Database,
              Effect.flatMap(db =>
                Effect.tryPromise({
                  try: () =>
                    db.item.update({
                      where: { id: req.id },
                      data: {
                        managementRepresentation: {
                          _tag: "Presto",
                          id: req.prestoId,
                        },
                      },
                    }),
                  catch: () => new SetPrestoIdError(),
                })
              ),
            ),
          ), { concurrency: "unbounded" }),
      ),
      pipe(
        // FIX: if 2 requests to the same modifier arrive, unexpected results will happen
        filterRequestsByTag(requests, "SetModifierConfig"),
        Effect.forEach(req =>
          Request.completeEffect(
            req,
            pipe(
              Schema.encode(ModifierConfig.Schema)(req.config),
              Effect.zip(Database),
              Effect.flatMap(([config, db]) =>
                Effect.tryPromise(() =>
                  db.itemModifier.update({
                    where: { id: req.id },
                    data: { config },
                  })
                )
              ),
              Effect.catchAll(() => Effect.fail(new SetModifierConfigError())),
            ),
          ), { concurrency: "unbounded" }),
      ),
      { concurrency: "unbounded" },
    )
  ),
  RequestResolver.contextFromServices(Database),
);
