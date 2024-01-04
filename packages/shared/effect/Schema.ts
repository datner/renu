import { AST, ParseResult, Schema } from "@effect/schema";
import { Either, Match, Option, pipe, Predicate, ReadonlyArray, ReadonlyRecord } from "effect";
import { Field, FieldError, FieldErrors, FieldValues, get, ResolverOptions, set } from "react-hook-form";

type Entry = [string, FieldError];
export const formatActual = (actual: unknown): string => {
  if (Predicate.isString(actual)) {
    return JSON.stringify(actual);
  } else if (
    Predicate.isNumber(actual)
    || actual == null
    || Predicate.isBoolean(actual)
    || Predicate.isSymbol(actual)
    || Predicate.isDate(actual)
  ) {
    return String(actual);
  } else if (Predicate.isBigInt(actual)) {
    return String(actual) + "n";
  } else if (
    !Array.isArray(actual)
    && Predicate.hasProperty(actual, "toString")
    && Predicate.isFunction(actual["toString"])
    && actual["toString"] !== Object.prototype.toString
  ) {
    return actual["toString"]();
  }
  try {
    return JSON.stringify(actual);
  } catch (e) {
    return String(actual);
  }
};

const formatTemplateLiteralSpan = (span: AST.TemplateLiteralSpan): string => {
  switch (span.type._tag) {
    case "StringKeyword":
      return "${string}";
    case "NumberKeyword":
      return "${number}";
  }
};

const formatTemplateLiteral = (ast: AST.TemplateLiteral): string =>
  ast.head + ast.spans.map((span) => formatTemplateLiteralSpan(span) + span.literal).join("");
const getMessage = (e: ParseResult.Type) =>
  AST.getMessageAnnotation(e.expected).pipe(
    Option.map((annotation) => annotation(e.actual)),
    Option.orElse(() => e.message),
    Option.getOrElse(() => `Expected ${formatExpected(e.expected)}, actual ${formatActual(e.actual)}`),
  );
const getExpected = (ast: AST.AST): Option.Option<string> =>
  AST.getIdentifierAnnotation(ast).pipe(
    Option.orElse(() => AST.getTitleAnnotation(ast)),
    Option.orElse(() => AST.getDescriptionAnnotation(ast)),
  );
export const formatExpected = (ast: AST.AST): string => {
  switch (ast._tag) {
    case "StringKeyword":
    case "NumberKeyword":
    case "BooleanKeyword":
    case "BigIntKeyword":
    case "UndefinedKeyword":
    case "SymbolKeyword":
    case "ObjectKeyword":
    case "AnyKeyword":
    case "UnknownKeyword":
    case "VoidKeyword":
    case "NeverKeyword":
      return Option.getOrElse(getExpected(ast), () => ast._tag);
    case "Literal":
      return Option.getOrElse(getExpected(ast), () => formatActual(ast.literal));
    case "UniqueSymbol":
      return Option.getOrElse(getExpected(ast), () => formatActual(ast.symbol));
    case "Union":
      return [...new Set(ast.types.map(formatExpected))].join(" or ");
    case "TemplateLiteral":
      return Option.getOrElse(getExpected(ast), () => formatTemplateLiteral(ast));
    case "Tuple":
      return Option.getOrElse(getExpected(ast), () => "<anonymous tuple or array schema>");
    case "TypeLiteral":
      return Option.getOrElse(getExpected(ast), () => "<anonymous type literal schema>");
    case "Enums":
      return Option.getOrElse(
        getExpected(ast),
        () => ast.enums.map((_, value) => JSON.stringify(value)).join(" | "),
      );
    case "Suspend":
      return Option.getOrElse(getExpected(ast), () => "<anonymous suspended schema>");
    case "Declaration":
      return Option.getOrElse(getExpected(ast), () => "<anonymous declaration schema>");
    case "Refinement":
      return Option.getOrElse(getExpected(ast), () => "<anonymous refinement schema>");
    case "Transform":
      return Option.getOrElse(
        getExpected(ast),
        () => `${formatExpected(ast.from)} <-> ${formatExpected(ast.to)}`,
      );
  }
};
const buildError = (error: ParseResult.ParseIssue, path = [] as string[]): Array<Entry> =>
  pipe(
    Match.value(error),
    Match.tag("Key", (e) =>
      ReadonlyArray.flatMap(e.errors, _ => buildError(_, ReadonlyArray.append(path, String(e.key))))),
    Match.tag("Index", (e) =>
      ReadonlyArray.flatMap(e.errors, _ =>
        buildError(_, ReadonlyArray.append(path, String(e.index))))),
    Match.tag("UnionMember", (e) =>
      ReadonlyArray.flatMap(e.errors, _ =>
        buildError(_, path))),
    Match.tag("Type", (_) => [
      [ReadonlyArray.join(path, "."), {
        type: _._tag,
        message: pipe(
          getMessage(_),
        ),
      }] as Entry,
    ]),
    Match.tag("Missing", (_) => [[ReadonlyArray.join(path, "."), { type: _._tag, message: "Missing" }] as Entry]),
    Match.tag("Forbidden", (_) => [[ReadonlyArray.join(path, "."), { type: _._tag, message: "Forbidden" }] as Entry]),
    Match.tag(
      "Unexpected",
      (_) => [[ReadonlyArray.join(path, "."), {
        type: _._tag,
        message: `Unexpected value${
          Option.map(_.ast, _ => formatExpected(_)).pipe(Option.match({
            onSome: _ => `, expected ${_}`,
            onNone: () => `.`,
          }))
        }`,
      }] as Entry],
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
      Either.match({
        onLeft: ({ errors }) => {
          return ({
            values: {},
            errors: toNestError(ReadonlyRecord.fromEntries(ReadonlyArray.flatMap(errors, _ => buildError(_))), options),
          });
        },
        onRight: values => ({ values, errors: {} }),
      }),
    );
