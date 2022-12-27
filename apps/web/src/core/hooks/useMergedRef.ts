import { useCallback, Ref } from "react"

export function useMergedRef<T = any>(refs: Ref<T>[]) {
  return useCallback(
    (node: T | null) => {
      refs.forEach((ref) => assignRef(ref, node))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs
  )
}
export function mergeRefs<T = any>(...refs: Ref<T>[]) {
  return (node: T | null) => {
    refs.forEach((ref) => assignRef(ref, node))
  }
}

export function assignRef<T = any>(ref: React.ForwardedRef<T>, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
  } else if (typeof ref === "object" && ref !== null && "current" in ref) {
    ref.current = value
  }
}
