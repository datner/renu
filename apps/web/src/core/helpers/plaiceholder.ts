import * as Data from "@effect/data/Data";
import * as Effect from "@effect/io/Effect";
import { Http } from "@integrations/core";

interface GetBlurHashError extends Data.Case {
  readonly _tag: "GetBlurHashError";
  readonly mesasge: string;
  readonly error: unknown;
}
const GetBlurHashError = Data.tagged<GetBlurHashError>("GetBlurHashError");

interface EmptyImageError extends Data.Case {
  readonly _tag: "EmptyImageError";
}
const EmptyImageError = Data.tagged<EmptyImageError>("EmptyImageError");

export const getBlurHash = (image: string) =>
  Effect.succeed(image).pipe(
    Effect.filterOrFail(
      // TODO: Find where the null leak is coming from
      (img) => typeof img === "string" && img !== "",
      () => EmptyImageError(),
    ),
    Effect.flatMap((img) =>
      Effect.promise(
        signal => fetch(`https://renu.imgix.net${img}?fm=blurhash&w=30`, { signal }),
      )
    ),
    // Effect.flatMap((img) => Http.request(`${img}?fm=blurhash&w=30`)),
    Effect.flatMap(Http.toText),
    Effect.catchTag("EmptyImageError", (_) => Effect.succeed(null)),
    Effect.mapError((error) => GetBlurHashError({ mesasge: "Could not get blurhash", error })),
    Effect.provideService(Http.HttpConfigService, {
      baseUrl: "https://renu.imgix.net",
    }),
  );

