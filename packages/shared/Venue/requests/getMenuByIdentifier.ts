import * as Data from "@effect/data/Data";
import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Request from "@effect/io/Request";
import * as RequestResolver from "@effect/io/RequestResolver";
import { Prisma } from "database";
import { Database } from "../../Database/service";

export class GetMenuByIdentifierError extends Data.TaggedClass("GetMenuByIdentifierError")<{}> {}

export interface GetMenuByIdentifier
  extends Request.Request<GetMenuByIdentifierError, Prisma.VenueGetPayload<{ select: typeof select }>>
{
  readonly _tag: "GetMenuByIdentifier";
  readonly identifier: string
}
export const GetMenuByIdentifier = Request.tagged<GetMenuByIdentifier>("GetMenuByIdentifier");

export const select = {
  id: true,
  open: true,
  simpleContactInfo: true,
  content: {
    select: {
      locale: true,
      name: true,
    },
  },
  categories: {
    orderBy: { identifier: Prisma.SortOrder.asc },
    where: { categoryItems: { some: { Item: { deleted: null } } }, deleted: null },
    select: {
      id: true,
      identifier: true,
      content: {
        select: {
          locale: true,
          name: true,
          description: true,
        },
      },
      categoryItems: {
        orderBy: { position: Prisma.SortOrder.asc },
        where: {
          Item: { deleted: null },
        },
        select: {
          position: true,
          Item: {
            select: {
              id: true,
              image: true,
              price: true,
              identifier: true,
              blurDataUrl: true,
              blurHash: true,
              categoryId: true,
              content: {
                select: {
                  locale: true,
                  name: true,
                  description: true,
                },
              },
              modifiers: {
                where: { deleted: null },
                orderBy: { position: Prisma.SortOrder.asc },
                select: {
                  id: true,
                  position: true,
                  config: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.VenueSelect;

export const makeGetMenuByIdentifierResolver = (db: Database) =>
  RequestResolver.fromFunctionEffect((request: GetMenuByIdentifier) =>
    Effect.tryCatchPromise(
      () => db.venue.findUniqueOrThrow({ where: { identifier: request.identifier }, select }),
      () => new GetMenuByIdentifierError(),
    )
  );

const resolveGetMenuByIdentifier = pipe(
  RequestResolver.fromFunctionEffect((request: GetMenuByIdentifier) =>
    Effect.flatMap(Database, db =>
      Effect.tryCatchPromise(
        () => db.venue.findUniqueOrThrow({ where: { identifier: request.identifier }, select }),
        () => new GetMenuByIdentifierError(),
      ))
  ),
  RequestResolver.contextFromEffect,
);

export const getMenuByIdentifier = (identifier: string) =>
  Effect.request(
    GetMenuByIdentifier({ identifier }),
    resolveGetMenuByIdentifier,
  );
