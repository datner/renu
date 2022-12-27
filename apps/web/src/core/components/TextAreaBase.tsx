import { ComponentPropsWithRef, forwardRef, memo } from "react"
import clsx from "clsx"

export type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "className">

export const TextAreaBase = memo(
  forwardRef<HTMLTextAreaElement, TextAreaProps>((props, ref) => (
    <textarea
      ref={ref}
      {...props}
      className={clsx([
        "appearance-none block w-full px-3 py-2",
        "border border-gray-300 rounded-md shadow-sm",
        "placeholder-gray-400",
        "sm:text-sm",
        "error:border-red-300 error:focus:ring-red-500 error:text-red-900",
        "focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none",
      ])}
    />
  ))
)
TextAreaBase.displayName = "TextAreaBase"
