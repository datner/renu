import * as E from "@effect/data/Either";
import { pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import * as Match from "@effect/match";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";

type Entry = [string, { readonly message: string }];

const buildError = (error: ParseResult.ParseErrors, path = [] as string[]): Array<Entry> =>
  pipe(
    Match.value(error),
    Match.tag("Key", (e) => A.flatMap(e.errors, _ => buildError(_, A.append(path, String(e.key))))),
    Match.tag("Index", (e) => A.flatMap(e.errors, _ => buildError(_, A.append(path, String(e.index))))),
    Match.tag("UnionMember", (e) => A.flatMap(e.errors, _ => buildError(_, path))),
    Match.tag("Type", (_) => [
      [A.join(path, "."), {
        message: O.getOrElse(_.message, () => `expected: ${_.expected._tag} actual: ${_.actual}`),
      }] as Entry,
    ]),
    Match.tag("Missing", (_) => [[A.join(path, "."), { message: "Missing" }] as Entry]),
    Match.tag("Forbidden", (_) => [[A.join(path, "."), { message: "Forbidden" }] as Entry]),
    Match.tag("Unexpected", (_) => [[A.join(path, "."), { message: `Unexpected: ${_.actual}` }] as Entry]),
    Match.exhaustive,
  );

export const schemaResolver = <I, A>(schema: Schema.Schema<I, A>) => (data: I, _context: any) =>
  pipe(
    Schema.decodeEither(schema)(data, { errors: "all" }),
    E.match(({ errors }) => {
      return ({
        values: {},
        errors: RR.fromEntries(A.flatMap(errors, _ => buildError(_))),
      });
    }, values => ({ values, errors: {} })),
  );

