import { getPlaiceholder } from "plaiceholder"

export async function getBlurDataUrl(image?: string) {
  if (!image) return undefined

  console.log("Creating new plaiceholder")
  const url = new URL(`https://renu.imgix.net/${image}`)
  url.searchParams.append("q", "5") // quality = 5
  url.searchParams.append("auto", "compress")
  const { base64: blurDataUrl } = await getPlaiceholder(url.toString(), { size: 10 })
  return blurDataUrl
}
