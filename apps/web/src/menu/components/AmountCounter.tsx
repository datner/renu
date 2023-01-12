import { animated, useSpring } from "@react-spring/web"
import { memo, ReactNode } from "react"
import { ResizeObserver } from "@juggle/resize-observer"
import { useIsRtl } from "src/core/hooks/useIsRtl"
import { usePrevious } from "src/core/hooks/usePrevious"
import useMeasure from "react-use-measure"
import clsx from "clsx"

type Props = {
  label: ReactNode
  amount: number
  className?: string
}

export const AmountCounter = memo((props: Props) => {
  const { label, amount, className = "text-emerald-600" } = props
  const [ref, { width }] = useMeasure({ polyfill: ResizeObserver })
  const isRtl = useIsRtl()
  const rtlWidth = isRtl ? width : -width
  const prevAmount = usePrevious(amount)
  const { opacity, x, scale, rotate } = useSpring({
    opacity: Math.min(1, amount),
    x: amount > 0 ? 0 : rtlWidth,
    scale: amount === prevAmount ? 1 : 15,
    rotate: amount === prevAmount ? "0deg" : amount % 2 === 0 ? "10000deg" : "-10000deg",
  })

  return (
    <animated.div style={{ x }} className="flex flex-nowrap">
      <animated.span
        ref={ref}
        style={{ opacity, scale, rotate }}
        className={clsx(
          "font-semibold overflow-visible inline-block ltr:pr-1.5 px-1 rtl:pl-1.5 pointer-events-none touch-none",
          className
        )}
      >
        x{amount || prevAmount}
      </animated.span>
      <animated.span className="block truncate">{label}</animated.span>
    </animated.div>
  )
})
AmountCounter.displayName = "AmountCounter"
