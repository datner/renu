import * as Effect from "@effect/io/Effect"
import { Http } from "@integrations/core"
import { pipe } from "fp-ts/function"
import { getPlaiceholder } from "plaiceholder"
import { inspect } from "util"

class GetBlurHashError extends Error {
  readonly _tag = "GetBlurHashError"
}

export const getBlurHash = (image: string) =>
  pipe(
    Http.request(`${image}?fm=blurhash&w=30`),
    Effect.tap(() => Effect.sync(() => console.log(image))),
    Effect.flatMap(Http.toText),
    Effect.tap((res) => Effect.sync(() => console.log(inspect(res)))),
    Effect.mapError((e) => new GetBlurHashError("Could not get blurhash", { cause: e })),
    Effect.provideService(Http.HttpConfigService, {
      baseUrl: "https://renu.imgix.net",
    })
  )

export async function getBlurDataUrl(image?: string) {
  if (!image) return undefined

  console.log("Creating new plaiceholder")
  const url = new URL(`https://renu.imgix.net/${image}`)
  url.searchParams.append("fm", "blurhash") // quality = 5
  url.searchParams.append("auto", "compress")
  const { base64: blurDataUrl } = await getPlaiceholder(url.toString(), { size: 10 })
  return blurDataUrl
}
