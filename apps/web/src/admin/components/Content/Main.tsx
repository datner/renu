import { ReactNode } from "react"

type Props = { children?: ReactNode }

export function Main(props: Props) {
  const { children } = props
  return (
    <main className="relative min-h-0 grow flex flex-col overflow-y-auto">
      <section
        aria-labelledby="primary-heading"
        className="min-h-0 grow flex flex-col lg:order-last"
      >
        <h1 id="primary-heading" className="sr-only">
          Photos
        </h1>
        {children}
      </section>
    </main>
  )
}
