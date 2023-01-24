import * as Z from "@effect/io/Effect"
import { Http } from "@integrations/core"
import { pipe } from "fp-ts/function"
import * as S from "@fp-ts/schema/Schema"
import { getPlaiceholder } from "plaiceholder"
import * as Utils from "shared/effect/Utils"

const ImgixBlurhashResponse = S.string

class GetBlurHashError extends Error {
  readonly _tag = "GetBlurHashError"
}

export const getBlurHash = (image: string) =>
  pipe(
    Http.request(`${image}?fm=blurhash&w=30`),
    Z.flatMap(Http.toJson),
    Z.flatMap(Utils.decode(ImgixBlurhashResponse)),
    Z.mapError((e) => new GetBlurHashError("Could not get blurhash", { cause: e })),
    Z.provideSomeLayer(Http.Layers.HttpFetchLayer),
    Z.provideService(Http.HttpConfigService)({
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
