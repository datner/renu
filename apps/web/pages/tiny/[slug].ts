import { gSSP } from "src/blitz-server"
import db from "db"

const Nothing = () => null

type QueryParams = {
  slug: string
}

export const getServerSideProps = gSSP<{}, QueryParams>(async (req) => {
  const slug = req.params?.slug
  if (!slug) return { notFound: true }

  const shortenedUrl = await db.shortenedUrl.findUnique({ where: { slug } })
  if (!shortenedUrl) return { notFound: true }

  let { destination } = shortenedUrl
  if (req.req.headers.host !== "renu.menu") {
    destination = "https://renu.menu" + destination
  }

  return {
    redirect: {
      permanent: true,
      destination,
    },
  }
})

export default Nothing
