import * as S from "@effect/schema/Schema";
import { Locale, Prisma } from "database";
import { Brand, pipe } from "effect";

export const Slug: S.BrandSchema<string, Slug> = pipe(
  S.string,
  S.minLength(1),
  S.pattern(/^[a-z0-9-]+$/, {
    message: (slug) => `${slug} should contain only lowercase letters, numbers, and dashes`,
  }),
  S.pattern(/[^-]$/, {
    message: (slug) => `${slug} should not end with a dash`,
  }),
  S.brand("Slug"),
);
export type Slug = Brand.Branded<string, "Slug">;

export const Id = <B extends string>(brand: B) => pipe(S.number, S.int(), S.positive(), S.brand(brand));

export const ForeignId = <B extends string>(brand: B) => pipe(S.string, S.brand(brand));

// TODO: change max length to 50. Stop sharon from giving monster names 🙄
export const Name = pipe(
  S.string,
  S.nonEmpty({ message: () => "Name is required" }),
  S.maxLength(180, { message: _ => `Name cannot be longer than 180. Got: ${_.length}` }),
);
export const Description = pipe(
  S.string,
  S.maxLength(180, { message: _ => `Description cannot be longer than 180. Got: ${_.length}` }),
);

export const Content = S.struct({
  id: S.number,
  locale: S.enums(Locale),
  name: Name,
  description: S.optionFromNullable(Description),
});

export interface Content extends S.Schema.To<typeof Content> {}
export interface ContentFrom extends S.Schema.From<typeof Content> {}

export const PrismaJson = S.unknown as S.Schema<Prisma.JsonValue, Prisma.JsonValue>;

export const fromPrisma: <I, A>(s: S.Schema<I, A>) => S.Schema<Prisma.JsonValue, A> = (s) => s as any;
