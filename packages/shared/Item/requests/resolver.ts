import * as Schema from "@effect/schema/Schema";
import { Effect, pipe, ReadonlyArray, Request, RequestResolver } from "effect";
import { Database, DB } from "../../Database";
import * as ModifierConfig from "../../modifier-config";
import { GetItemById } from "./getById";
import { GetItemByIdentifier } from "./getByIdentifier";
import { GetItemsByVenue } from "./getByVenue";
import { GetItemContent } from "./getContent";
import { GetItemModifierById } from "./getModifierById";
import { GetItemModifiers } from "./getModifiers";
import { SetModifierConfig } from "./setModifierConfig";
import { SetPrestoId } from "./setPrestoId";

type ItemRequest =
  | GetItemById
  | GetItemByIdentifier
  | GetItemContent
  | GetItemModifiers
  | GetItemModifierById
  | GetItemsByVenue
  | SetModifierConfig
  | SetPrestoId;

const encodeModifier = Schema.encode(ModifierConfig.Schema);
export const ItemResolver = pipe(
  RequestResolver.makeBatched<DB, ItemRequest>((
    requests,
  ) => {
    const reqMap = ReadonlyArray.groupBy(requests, _ => _._tag);
    const modifiers = reqMap.GetItemModifiers as GetItemModifiers[] ?? [];
    const content = reqMap.GetItemContent as GetItemContent[] ?? [];
    const modById = reqMap.GetItemModifierById as GetItemModifierById[] ?? [];
    const byVenue = reqMap.GetItemsByVenue as GetItemsByVenue[] ?? [];
    const byId = reqMap.GetItemById as GetItemById[] ?? [];
    const byIdentifier = reqMap.GetItemByIdentifier as GetItemByIdentifier[] ?? [];
    const setModConf = reqMap.SetModifierConfig as SetModifierConfig[] ?? [];
    const setPrestoId = reqMap.SetPrestoId as SetPrestoId[] ?? [];
    return Effect.andThen(Database, db =>
      Effect.all({
        GetItemContent: Effect.promise(() =>
          Promise.all(
            content.map(_ => db.item.findUnique({ where: { id: _.id } }).content()),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(content)),
          Effect.flatMap(
            Effect.forEach(([content, req]) => Request.succeed(req, content ?? [])),
          ),
        ),
        GetItemModifiers: Effect.promise(() =>
          Promise.all(
            modifiers.map(_ => db.item.findUnique({ where: { id: _.id } }).modifiers()),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(modifiers)),
          Effect.flatMap(
            Effect.forEach(([mods, req]) => Request.succeed(req, mods ?? [])),
          ),
        ),
        GetItemsByVenue: Effect.promise(() =>
          Promise.all(
            byVenue.map(_ =>
              db.venue.findUnique({ where: { id: _.venueId, organizationId: _.orgId } }).inventory({
                include: { content: true },
              })
            ),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(byVenue)),
          Effect.flatMap(
            Effect.forEach(([inventory, req]) => Request.succeed(req, inventory ?? [])),
          ),
        ),
        GetItemModifierById: Effect.promise(() =>
          db.itemModifier.findMany({
            where: { id: { in: modById.map(_ => _.id) } },
          })
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(modById)),
          Effect.flatMap(
            Effect.forEach(([mod, req]) => Request.succeed(req, mod)),
          ),
        ),
        GetItemById: Effect.promise(() =>
          db.item.findMany({
            where: {
              id: { in: byId.map(_ => _.id) },
            },
            include: { content: true },
          })
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(byId)),
          Effect.flatMap(
            Effect.forEach(([item, req]) => Request.succeed(req, item)),
          ),
        ),
        GetItemByIdentifier: Effect.promise(() =>
          db.item.findMany({
            where: {
              identifier: { in: byIdentifier.map(_ => _.identifier) },
            },
            include: { content: true },
          })
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(byIdentifier)),
          Effect.flatMap(
            Effect.forEach(([item, req]) => Request.succeed(req, item)),
          ),
        ),
        SetModifierConfig: Effect.andThen(
          Effect.forEach(setModConf, _ => encodeModifier(_.config)),
          (configs) =>
            db.$transaction(
              ReadonlyArray.zip(setModConf, configs).map(
                ([req, config]) =>
                  db.itemModifier.update({
                    where: { id: req.id },
                    data: { config },
                  }),
              ),
            ),
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(setModConf)),
          Effect.flatMap(
            Effect.forEach(([item, req]) => Request.succeed(req, item)),
          ),
        ),
        SetPrestoId: Effect.promise(() =>
          db.$transaction(
            setPrestoId.map(_ =>
              db.item.update({
                where: { id: _.id },
                data: {
                  managementRepresentation: {
                    _tag: "Presto",
                    id: _.prestoId,
                  },
                },
              })
            ),
          )
        ).pipe(
          Effect.orDie,
          Effect.map(ReadonlyArray.zip(setPrestoId)),
          Effect.flatMap(
            Effect.forEach(([item, req]) => Request.succeed(req, item)),
          ),
        ),
      }, { concurrency: 9 }));
  }),
  RequestResolver.contextFromServices(Database),
);
