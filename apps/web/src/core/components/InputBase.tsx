import { ComponentPropsWithRef, forwardRef, memo } from "react"
import clsx from "clsx"

type InputProps = Omit<ComponentPropsWithRef<"input">, "className">

export const InputBase = memo(
  forwardRef<HTMLInputElement, InputProps>((props, ref) => (
    <input
      ref={ref}
      type="text"
      {...props}
      className={clsx([
        "appearance-none block w-full px-3 py-2",
        "border border-gray-300 rounded-md shadow-sm",
        "placeholder-gray-400",
        "sm:text-sm",
        "error:border-red-300 error:focus:ring-red-500 error:text-red-900",
        "focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none",
        "disabled:bg-gray-200",
      ])}
    />
  ))
)
InputBase.displayName = "InputBase"
