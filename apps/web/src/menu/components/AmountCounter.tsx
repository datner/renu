import { animated, useSpring } from "@react-spring/web"
import { memo, ReactNode } from "react"
import { ResizeObserver } from "@juggle/resize-observer"
import { useIsRtl } from "src/core/hooks/useIsRtl"
import { usePrevious } from "src/core/hooks/usePrevious"
import useMeasure from "react-use-measure"

type Props = {
  label: ReactNode
  amount: number
}

export const AmountCounter = memo((props: Props) => {
  const { label, amount } = props
  const [ref, { width }] = useMeasure({ polyfill: ResizeObserver })
  const isRtl = useIsRtl()
  const rtlWidth = isRtl ? width : -width
  const { opacity, x } = useSpring({
    opacity: Math.min(1, amount),
    x: amount > 0 ? 0 : rtlWidth,
  })

  const prevAmount = usePrevious(amount)

  return (
    <animated.div style={{ x }} className="flex flex-nowrap">
      <animated.span
        ref={ref}
        style={{ opacity }}
        className="font-semibold ltr:pr-1.5 px-1 rtl:pl-1.5 text-emerald-600 pointer-events-none touch-none"
      >
        x{amount || prevAmount}
      </animated.span>
      <animated.span className="block truncate">{label}</animated.span>
    </animated.div>
  )
})
AmountCounter.displayName = "AmountCounter"
