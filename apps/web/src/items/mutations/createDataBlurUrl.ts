import { resolver } from "@blitzjs/rpc"
import db from "db"
import { getPlaiceholder } from "plaiceholder"

const getBlurDataUrl = async (img: string) => {
  if (img === "" || img.startsWith("item")) return ""
  const url = new URL(`https://renu.imgix.net${img}`)
  url.searchParams.append("q", "5")
  url.searchParams.append("auto", "compress")
  console.log(url.toString())
  const { base64 } = await getPlaiceholder(url.toString(), { size: 10 })
  return base64
}

export default resolver.pipe(async () => {
  const items = await db.item.findMany({ where: { image: { not: { equals: "" } } } })
  const blurList = await Promise.all(items.map((it) => getBlurDataUrl(it.image)))
  await db.$transaction(
    items.map(({ id }, i) =>
      db.item.update({
        where: { id },
        data: { blurDataUrl: blurList[i] },
      })
    )
  )
  return { success: true }
})
