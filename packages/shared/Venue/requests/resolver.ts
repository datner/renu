import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as Effect from "@effect/io/Effect";
import * as Exit from "@effect/io/Exit";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import * as Models from "database";
import { inspect } from "util";
import { Database } from "../../Database";
import { filterRequestsByTag, resolveBatch, resolveSingle } from "../../effect/Request";
import { GetVenueById, GetVenueByIdError } from "./getById";
import { GetVenueByIdentifier, GetVenueByIdentifierError } from "./getByIdentifier";
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

export const VenueResolver = pipe(
  RequestResolver.makeBatched((
    requests: VenueRequest[],
  ) =>
    Effect.allPar(
      Effect.sync(() => console.log(inspect(requests.map(r => r._tag), false, null, true))),
      resolveBatch(
        filterRequestsByTag(requests, "GetVenueCategories"),
        (reqs, db) =>
          db.category.findMany({
            where: { venueId: { in: reqs.map(req => req.id) }, deleted: null },
            orderBy: { venueId: "asc" },
          }),
        r => String(r.id),
        d => String(d.venueId),
      ),
      resolveBatch(
        filterRequestsByTag(requests, "GetVenueContent"),
        (reqs, db) =>
          db.restaurantI18L.findMany({
            where: { venueId: { in: reqs.map(req => req.id) } },
            orderBy: { venueId: "asc" },
          }),
        r => String(r.id),
        d => String(d.venueId),
      ),
      resolveSingle(
        filterRequestsByTag(requests, "GetVenueClearingIntegration"),
        (reqs, db) =>
          db.clearingIntegration.findMany({
            where: { venueId: { in: reqs.map(_ => _.id) } },
          }),
        (req, integs) =>
          Option.match(
            A.findFirst(integs, _ => _.venueId === req.id),
            () => Exit.fail(new GetVenueClearingIntegrationError()),
            Exit.succeed,
          ),
      ),
      resolveSingle(
        filterRequestsByTag(requests, "GetVenueManagementIntegration"),
        (reqs, db) =>
          db.managementIntegration.findMany({
            where: { venueId: { in: reqs.map(_ => _.id) } },
          }),
        (req, integs) =>
          Option.match(
            A.findFirst(integs, _ => _.venueId === req.id),
            () => Exit.fail(new GetVenueManagementIntegrationError()),
            Exit.succeed,
          ),
      ),
      pipe(
        Effect.flatMap(Database, db =>
          Effect.promise(
            () =>
              db.venue.findMany({
                where: {
                  OR: [
                    idIn(requests),
                    identifierIn(requests),
                  ],
                  deleted: null,
                },
              }),
          )),
        Effect.flatMap(venues =>
          Effect.allPar(
            Effect.forEachPar(getByIds(requests), req =>
              Request.complete(
                req,
                Option.match(
                  A.findFirst(venues, _ => _.id === req.id),
                  () => Exit.fail(new GetVenueByIdError()),
                  Exit.succeed,
                ),
              )),
            Effect.forEachPar(getByIdentifiers(requests), req =>
              Request.complete(
                req,
                Option.match(
                  A.findFirst(venues, _ => _.identifier === req.identifier),
                  () => Exit.fail(new GetVenueByIdentifierError()),
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
  (_: VenueRequest) => _._tag === "GetVenueById" ? Option.some(_) : Option.none(),
);

const getByIdentifiers = A.filterMap(
  (_: VenueRequest) => _._tag === "GetVenueByIdentifier" ? Option.some(_) : Option.none(),
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
