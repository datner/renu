import { ResizeObserver } from "@juggle/resize-observer";
import { animated, config, useSpring } from "@react-spring/web";
import clsx from "clsx";
import { memo, ReactNode, useEffect } from "react";
import useMeasure from "react-use-measure";
import { useIsRtl } from "src/core/hooks/useIsRtl";
import { usePrevious } from "src/core/hooks/usePrevious";

type Props = {
  label: ReactNode;
  amount: number;
  className?: string;
};

export const AmountCounter = memo((props: Props) => {
  const { label, amount, className = "text-emerald-600" } = props;
  const [ref, { width }] = useMeasure({ polyfill: ResizeObserver });
  const isRtl = useIsRtl();
  const rtlWidth = isRtl ? width : -width;
  const prevAmount = usePrevious(amount);
  const { opacity, x, scale, rotate } = useSpring({
    opacity: Math.min(1, amount),
    x: amount > 0 ? 0 : rtlWidth,
    scale: 1,
    rotate: "0deg",
  });

  useEffect(() => {
    scale.set(1);
    rotate.set("0deg");
    scale.start(1.4, { config: config.stiff }).then(() => scale.start(1));
    rotate
      .start(amount % 2 === 0 ? "15deg" : "-15deg", { config: config.stiff })
      .then(() => rotate.start("0deg"));
  }, [amount, scale, rotate]);

  return (
    <animated.div style={{ x }} className="flex flex-nowrap">
      <animated.span
        ref={ref}
        style={{ opacity, scale, rotate }}
        className={clsx(
          "font-semibold overflow-visible inline-block ltr:pr-1.5 px-1 rtl:pl-1.5 pointer-events-none touch-none",
          className,
        )}
      >
        x{amount || prevAmount}
      </animated.span>
      <span className="block truncate">{label}</span>
    </animated.div>
  );
});
AmountCounter.displayName = "AmountCounter";
