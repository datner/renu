import * as Data from "@effect/data/Data";
import * as Effect from "@effect/io/Effect";
import { Http } from "@integrations/core";
import { pipe } from "fp-ts/function";

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
  pipe(
    Effect.succeed(image),
    Effect.filterOrFail(
      // TODO: Find where the null leak is coming from
      (img) => typeof img === "string" && img !== "",
      () => EmptyImageError(),
    ),
    Effect.flatMap((img) => Http.request(`${img}?fm=blurhash&w=30`)),
    Effect.flatMap(Http.toText),
    Effect.catchTag("EmptyImageError", (_) => Effect.succeed(null)),
    Effect.mapError((error) => GetBlurHashError({ mesasge: "Could not get blurhash", error })),
    Effect.provideService(Http.HttpConfigService, {
      baseUrl: "https://renu.imgix.net",
    }),
  );

// TODO: remove or restore. Just don't keep
// export async function getBlurDataUrl(image?: string) {
//   if (!image) return undefined;
//
//   console.log("Creating new plaiceholder");
//   const url = new URL(`https://renu.imgix.net/${image}`);
//   url.searchParams.append("fm", "blurhash"); // quality = 5
//   url.searchParams.append("auto", "compress");
//   const { base64: blurDataUrl } = await getPlaiceholder(url.toString(), { size: 10 });
//   return blurDataUrl;
// }
