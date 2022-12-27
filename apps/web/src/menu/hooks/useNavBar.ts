import { useRef } from "react"
import { Option, some, map, match, chain, getEq, fromNullable } from "fp-ts/Option"
import { findLast, last } from "fp-ts/Array"
import { Eq as eqStr } from "fp-ts/string"
import { useStableO } from "fp-ts-react-stable-hooks"
import { pipe } from "fp-ts/function"

interface NavigationRefs {
  container: HTMLDivElement | null
  sections: HTMLDivElement[]
  buttons: Record<string, HTMLButtonElement>
}

interface UseNavBarProps {
  initialActive: Option<string>
}

const STICKY_BAR_HEIGHT = 52

const fromTop = (el: HTMLDivElement) => el.scrollTop + STICKY_BAR_HEIGHT + 1

const active = (els: HTMLDivElement[]) => (container: HTMLDivElement) =>
  pipe(
    els,
    findLast((el: HTMLDivElement) => fromTop(container) > el.offsetTop),
    match(() => last(els), some)
  )

const eqOStr = getEq(eqStr)

export function useNavBar(props: UseNavBarProps) {
  const { initialActive } = props
  const refs = useRef<NavigationRefs>({
    container: null,
    buttons: {},
    sections: [],
  })

  const [section, set] = useStableO(initialActive)

  const setButton = (id: string) => (e: HTMLButtonElement | null) =>
    pipe(
      fromNullable(e),
      map((el) => (refs.current.buttons[id] = el))
    )

  const setSection = (e: HTMLDivElement | null) =>
    pipe(
      fromNullable(e),
      map((el) => refs.current.sections.push(el))
    )

  const onScroll = () =>
    pipe(
      fromNullable(refs.current.container),
      chain(active(refs.current.sections)),
      chain((el) => {
        if (!eqOStr.equals(section, some(el.id))) set(some(el.id))

        return fromNullable(refs.current.buttons[el.id])
      }),
      map((el) => el.scrollIntoView({ inline: "start", behavior: "smooth" }))
    )

  const onClick = (index: number) => () => {
    const el = refs.current.sections[index]
    if (!refs.current.container || !el) return

    const top = el.offsetTop - STICKY_BAR_HEIGHT
    refs.current.container.scroll({ top, behavior: "smooth" })
  }

  return {
    setSection,
    setButton,
    setContainer: (el: HTMLDivElement) => (refs.current.container = el),
    onScroll,
    onClick,
    section,
  }
}
