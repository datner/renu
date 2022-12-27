import { useRouter } from "next/router"
import Link, { LinkProps } from "next/link"
import React, { useState, useEffect, ReactElement } from "react"

type ActiveLinkProps = LinkProps & {
  children: (props: { active: boolean }) => ReactElement
}

export const ActiveLink = ({ children, ...props }: ActiveLinkProps) => {
  const { asPath, isReady } = useRouter()

  const [active, setActive] = useState(false)

  useEffect(() => {
    // Check if the router fields are updated client-side
    if (isReady) {
      // Dynamic route will be matched via props.as
      // Static route will be matched via props.href
      const linkPathname = new URL((props.as || props.href) as string, location.href).pathname

      // Using URL().pathname to get rid of query and hash
      const activePathname = new URL(asPath, location.href).pathname
      setActive(activePathname.startsWith(linkPathname))
    }
  }, [asPath, isReady, props.as, props.href])

  return (
    <Link {...props} legacyBehavior>
      {children({ active })}
    </Link>
  )
}
