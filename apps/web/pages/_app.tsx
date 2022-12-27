import { withBlitz } from "src/blitz-client"
import { useQueryErrorResetBoundary } from "@blitzjs/rpc"
import { AppProps, ErrorBoundary, ErrorComponent, ErrorFallbackProps } from "@blitzjs/next"
import { LoginForm } from "src/auth/components/LoginForm"
import { NextIntlProvider } from "next-intl"
import { useLocale } from "src/core/hooks/useLocale"
import { Locale } from "@prisma/client"
import { useIsomorphicLayoutEffect } from "src/core/hooks/useIsomorphicLayoutEffect"
import { AuthenticationError, AuthorizationError } from "blitz"
import { MantineProvider } from "src/core/components/MantineProvider"
import clsx from "clsx"
import { Secular_One, Noto_Sans } from "@next/font/google"

import "src/core/styles/index.css"

const secularOne = Secular_One({
  weight: "400",
  subsets: ["hebrew", "latin"],
  variable: "--font-secular-one",
})

const notoSans = Noto_Sans({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-noto-sans",
})

// @ts-expect-error -- blitz broke the types here
export default withBlitz(function App({
  Component,
  pageProps,
}: AppProps<{ messages: IntlMessages }>) {
  const getLayout = Component.getLayout || ((page) => page)
  const { messages, ...rest } = pageProps
  const locale = useLocale()
  const rtl = locale === Locale.he
  const dir = rtl ? "rtl" : "ltr"

  useIsomorphicLayoutEffect(() => {
    document.dir = dir
    document.documentElement.lang = locale
  }, [locale, dir])

  return (
    <NextIntlProvider messages={messages}>
      {/* This MantineProvider is a local component */}
      <MantineProvider>
        <ErrorBoundary
          FallbackComponent={RootErrorFallback}
          onReset={useQueryErrorResetBoundary().reset}
        >
          <div className={clsx(secularOne.variable, notoSans.variable, "flex grow min-h-0")}>
            {getLayout(<Component {...rest} />)}
          </div>
        </ErrorBoundary>
      </MantineProvider>
    </NextIntlProvider>
  )
})

function RootErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  if (error instanceof AuthenticationError) {
    return <LoginForm onSuccess={resetErrorBoundary} />
  } else if (error instanceof AuthorizationError) {
    return (
      <ErrorComponent
        statusCode={error.statusCode}
        title="Sorry, you are not authorized to access this"
      />
    )
  } else {
    return (
      <ErrorComponent statusCode={error.statusCode || 400} title={error.message || error.name} />
    )
  }
}
