import * as E from "@effect/data/Either";
import { apply, pipe } from "@effect/data/Function";
import * as O from "@effect/data/Option";
import * as Predicate from "@effect/data/Predicate";
import * as A from "@effect/data/ReadonlyArray";
import * as RR from "@effect/data/ReadonlyRecord";
import * as Match from "@effect/match";
import * as AST from "@effect/schema/AST";
import * as ParseResult from "@effect/schema/ParseResult";
import * as Schema from "@effect/schema/Schema";
import { Field, FieldError, FieldErrors, FieldValues, get, ResolverOptions, set } from "react-hook-form";

type Entry = [string, FieldError];

const getMessage = AST.getAnnotation<AST.MessageAnnotation<unknown>>(AST.MessageAnnotationId);
const getExamples = AST.getAnnotation<AST.ExamplesAnnotation>(AST.MessageAnnotationId);

const buildError = (error: ParseResult.ParseErrors, path = [] as string[]): Array<Entry> =>
  pipe(
    Match.value(error),
    Match.tag("Key", (e) => A.flatMap(e.errors, _ => buildError(_, A.append(path, String(e.key))))),
    Match.tag("Index", (e) => A.flatMap(e.errors, _ => buildError(_, A.append(path, String(e.index))))),
    Match.tag("UnionMember", (e) => A.flatMap(e.errors, _ => buildError(_, path))),
    Match.tag("Type", (_) => [
      [A.join(path, "."), {
        type: _._tag,
        message: pipe(
          _.message,
          O.orElse(() => O.map(getMessage(_.expected), apply(_.actual))),
          O.orElse(() => pipe(getExamples(_.expected), O.map(A.filter(Predicate.isString)), O.map(A.join(", ")))),
          O.getOrElse(() => `Unexpected value: ${_.actual}`),
        ),
      }] as Entry,
    ]),
    Match.tag("Missing", (_) => [[A.join(path, "."), { type: _._tag, message: "Missing" }] as Entry]),
    Match.tag("Forbidden", (_) => [[A.join(path, "."), { type: _._tag, message: "Forbidden" }] as Entry]),
    Match.tag(
      "Unexpected",
      (_) => [[A.join(path, "."), { type: _._tag, message: `Unexpected value: ${_.actual}` }] as Entry],
    ),
    Match.exhaustive,
  );

const toNestError = <TFieldValues extends FieldValues>(
  errors: FieldErrors,
  options: ResolverOptions<TFieldValues>,
): FieldErrors<TFieldValues> => {
  const fieldErrors = {} as FieldErrors<TFieldValues>;
  for (const path in errors) {
    const field = get(options.fields, path) as Field["_f"] | undefined;

    set(
      fieldErrors,
      path,
      Object.assign(errors[path] || {}, { ref: field && field.ref }),
    );
  }

  return fieldErrors;
};

export const schemaResolver =
  <I extends FieldValues, A>(schema: Schema.Schema<I, A>) => (data: I, _context: any, options: ResolverOptions<I>) =>
    pipe(
      Schema.decodeEither(schema)(data, { errors: "all" }),
      E.match({
        onLeft: ({ errors }) => {
          return ({
            values: {},
            errors: toNestError(RR.fromEntries(A.flatMap(errors, _ => buildError(_))), options),
          });
        },
        onRight: values => ({ values, errors: {} }),
      }),
    );
