import { Prisma } from "database";
import { Data, Effect, Request, RequestResolver } from "effect";
import { Database } from "../../Database/service";

export class GetMenuByIdentifierError extends Data.TaggedClass("GetMenuByIdentifierError")<{
  readonly error: unknown;
}> {}

export interface GetMenuByIdentifier
  extends Request.Request<GetMenuByIdentifierError, Prisma.VenueGetPayload<{ select: typeof select }>>
{
  readonly _tag: "GetMenuByIdentifier";
  readonly identifier: string;
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
  RequestResolver.fromEffect((request: GetMenuByIdentifier) =>
    Effect.tryPromise({
      try: () => db.venue.findUniqueOrThrow({ where: { identifier: request.identifier }, select }),
      catch: (error) => new GetMenuByIdentifierError({ error }),
    })
  );

const resolveGetMenuByIdentifier = RequestResolver.fromEffect((request: GetMenuByIdentifier) =>
  Effect.flatMap(Database, db =>
    Effect.tryPromise({
      try: () => db.venue.findUniqueOrThrow({ where: { identifier: request.identifier }, select }),
      catch: (error) => new GetMenuByIdentifierError({ error }),
    }))
).pipe(
  RequestResolver.contextFromEffect,
);

export const getMenuByIdentifier = (identifier: string) =>
  Effect.request(
    GetMenuByIdentifier({ identifier }),
    resolveGetMenuByIdentifier,
  );
