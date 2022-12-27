import { ExclamationCircleIcon } from "@heroicons/react/24/solid"
import { ComponentPropsWithoutRef, memo } from "react"
import { TextAreaBase, TextAreaProps } from "./TextAreaBase"

export interface LabeledTextAreaProps extends TextAreaProps {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  /** Field type. Doesn't include radio buttons and checkboxes */
  type?: "text" | "password" | "email" | "number"
  outerProps?: ComponentPropsWithoutRef<"div">
  labelProps?: ComponentPropsWithoutRef<"label">
  error?: string
}

export const LabeledTextAreaNoForm = memo<LabeledTextAreaProps>(
  ({ label, error, outerProps, labelProps, name, ...props }) => {
    const errorId = `${name}-error`
    return (
      <div {...outerProps}>
        <label {...labelProps}>
          <span className="block text-sm font-medium text-gray-700">{label}</span>
          <div className="mt-1 relative">
            <TextAreaBase
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
            {error}
          </p>
        )}
      </div>
    )
  }
)
LabeledTextAreaNoForm.displayName = "LabeledTextAreaNoForm"

export default LabeledTextAreaNoForm
