import Head from "next/head"
import { BlitzLayout } from "@blitzjs/next"

const Layout: BlitzLayout<{ title?: string; children?: React.ReactNode }> = ({
  title,
  children,
}) => {
  return (
    <>
      <Head>
        <title>{title || "menus-blitz"}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {children}
    </>
  )
}

export default Layout
