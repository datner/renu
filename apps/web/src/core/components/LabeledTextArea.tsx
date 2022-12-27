import { ExclamationCircleIcon } from "@heroicons/react/24/solid"
import { ComponentPropsWithoutRef, memo } from "react"
import { RegisterOptions, useFormContext } from "react-hook-form"
import { TextAreaBase, TextAreaProps } from "./TextAreaBase"

export interface LabeledTextAreaProps extends TextAreaProps {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  /** Field type. Doesn't include radio buttons and checkboxes */
  type?: "text" | "password" | "email" | "number"
  registerOptions?: RegisterOptions
  outerProps?: ComponentPropsWithoutRef<"div">
  labelProps?: ComponentPropsWithoutRef<"label">
}

export const LabeledTextArea = memo<LabeledTextAreaProps>(
  ({ label, outerProps, labelProps, name, registerOptions, ...props }) => {
    const { register, getFieldState, formState } = useFormContext()
    const { error } = getFieldState(name, formState)
    const errorId = `${name}-error`
    return (
      <div {...outerProps}>
        <label {...labelProps}>
          <span className="block text-sm font-medium text-gray-700">{label}</span>
          <div className="mt-1 relative">
            <TextAreaBase
              {...register(name, registerOptions)}
              {...props}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? errorId : undefined}
            />
            {error && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
              </div>
            )}
          </div>
        </label>

        {error && (
          <p id={errorId} className="mt-2 text-sm text-red-600">
            {error.message}
          </p>
        )}
      </div>
    )
  }
)
LabeledTextArea.displayName = "LabeledTextArea"

export default LabeledTextArea
