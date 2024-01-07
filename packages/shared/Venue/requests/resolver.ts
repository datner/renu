import * as Models from "database";
import { Console, Effect, Exit, Option, ReadonlyArray as A, Request, RequestResolver } from "effect";
import { ReadonlyArray } from "effect";
import { Database, DB } from "../../Database";
import { GetVenueById } from "./getById";
import { GetVenueByIdentifier } from "./getByIdentifier";
import { GetVenueCategories } from "./getCategories";
import { GetVenueClearingIntegration, GetVenueClearingIntegrationError } from "./getClearingIntegration";
import { GetVenueContent } from "./getContent";
import { GetVenueManagementIntegration, GetVenueManagementIntegrationError } from "./getManagementIntegration";

type VenueRequest =
  | GetVenueById
  | GetVenueByIdentifier
  | GetVenueContent
  | GetVenueCategories
  | GetVenueClearingIntegration
  | GetVenueManagementIntegration;

export const VenueResolver = RequestResolver.makeBatched<DB, VenueRequest>((
  requests,
) => {
  const reqMap = ReadonlyArray.groupBy(requests, _ => _._tag);
  const categories = reqMap.GetVenueCategories as GetVenueCategories[] ?? [];
  const content = reqMap.GetVenueContent as GetVenueContent[] ?? [];
  const clearing = reqMap.GetVenueClearingIntegration as GetVenueClearingIntegration[] ?? [];
  const management = reqMap.GetVenueManagementIntegration as GetVenueManagementIntegration[] ?? [];
  const byId = reqMap.GetVenueById as GetVenueById[] ?? [];
  const byIdentifier = reqMap.GetVenueByIdentifier as GetVenueByIdentifier[] ?? [];
  return Effect.andThen(Database, db =>
    Effect.all({
      GetVenueCategories: Effect.promise(() =>
        Promise.all(
          categories.map(_ =>
            db.venue.findUniqueOrThrow({ where: { id: _.id } }).categories({
              where: { deleted: null },
              include: { content: true },
            })
          ),
        )
      ).pipe(
        Effect.tap(Console.log),
        Effect.withLogSpan("GetVenueCategories"),
        Effect.orDie,
        Effect.map(ReadonlyArray.zip(categories)),
        Effect.flatMap(Effect.forEach(([categories, req]) => Request.succeed(req, categories))),
      ),
      GetVenueContent: Effect.promise(() =>
        Promise.all(
          content.map(_ => db.venue.findUniqueOrThrow({ where: { id: _.id } }).content()),
        )
      ).pipe(
        Effect.orDie,
        Effect.map(ReadonlyArray.zip(content)),
        Effect.flatMap(Effect.forEach(([_, req]) => Request.succeed(req, _))),
      ),
      GetVenueClearingIntegration: Effect.promise(() =>
        Promise.all(
          clearing.map(_ => db.venue.findUniqueOrThrow({ where: { id: _.id } }).clearingIntegration()),
        )
      ).pipe(
        Effect.orDie,
        Effect.map(ReadonlyArray.zip(clearing)),
        Effect.flatMap(Effect.forEach(([_, req]) =>
          Request.succeed(
            req,
            Option.fromNullable(_),
          )
        )),
      ),
      GetVenueManagementIntegration: Effect.promise(() =>
        Promise.all(
          management.map(_ => db.venue.findUniqueOrThrow({ where: { id: _.id } }).managementIntegration()),
        )
      ).pipe(
        Effect.orDie,
        Effect.map(ReadonlyArray.zip(management)),
        Effect.flatMap(Effect.forEach(([_, req]) =>
          Request.complete(
            req,
            _
              ? Exit.succeed(_)
              : Exit.fail(new GetVenueManagementIntegrationError()),
          )
        )),
      ),
      GetVenueById: Effect.promise(() =>
        db.venue.findMany({
          where: idIn(byId),
        })
      ).pipe(
        Effect.orDie,
        Effect.map(ReadonlyArray.zip(byId)),
        Effect.flatMap(Effect.forEach(([_, req]) => Request.succeed(req, _))),
      ),
      GetVenueByIdentifier: Effect.promise(() =>
        db.venue.findMany({
          where: identifierIn(byIdentifier),
        })
      ).pipe(
        Effect.orDie,
        Effect.map(ReadonlyArray.zip(byIdentifier)),
        Effect.flatMap(Effect.forEach(([_, req]) => Request.succeed(req, _))),
      ),
    }, { concurrency: "unbounded" }));
}).pipe(
  RequestResolver.contextFromServices(Database),
);

const idIn = (reqs: VenueRequest[]) => ({
  id: {
    in: A.filterMap(
      reqs,
      _ => _._tag === "GetVenueById" ? Option.some(_.id) : Option.none(),
    ),
  },
} satisfies Models.Prisma.VenueWhereInput);

const identifierIn = (reqs: VenueRequest[]) => ({
  identifier: {
    in: A.filterMap(
      reqs,
      _ => _._tag === "GetVenueByIdentifier" ? Option.some(_.identifier) : Option.none(),
    ),
  },
} satisfies Models.Prisma.VenueWhereInput);
