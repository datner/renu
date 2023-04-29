import { pipe } from "@effect/data/Function";
import * as Option from "@effect/data/Option";
import * as S from "@effect/schema/Schema";
import { Locale, Prisma } from "database";

export const Slug = pipe(
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
export type Slug = S.To<typeof Slug>;

export const Id = <B extends string>(brand: B) => pipe(S.number, S.int(), S.positive(), S.brand(brand));

export const ForeignId = <B extends string>(brand: B) => pipe(S.string, S.brand(brand));

// TODO: change max length to 50. Stop sharon from giving monster names 🙄
export const Name = pipe(S.string, S.nonEmpty(), S.maxLength(180), S.trim);
export const Description = pipe(S.string, S.maxLength(180), S.optionFromNullable);

// TODO: Booooooo
export const Content = S.transform(
  S.struct({
    locale: S.enums(Locale),
    name: Name,
    description: S.optional(Description),
  }),
  S.struct({
    locale: S.enums(Locale),
    name: Name,
    description: S.to(Description),
  }),
  c => ({ ...c, description: Option.isOption(c.description) ? c.description : Option.none() }),
  c => c,
);
export interface Content extends S.To<typeof Content> {}

export const fromJson = <I extends S.Json, A>(schema: S.Schema<I, A>) => schema;

export const PrismaJson = S.json as S.Schema<Prisma.JsonValue, S.Json>;

export const fromPrisma: <I, A>(s: S.Schema<I, A>) => S.Schema<Prisma.JsonValue, A> = (s) => s as any;
