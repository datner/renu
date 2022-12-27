import { useCallback, useRef } from "react"
import { useIsomorphicLayoutEffect } from "./useIsomorphicLayoutEffect"

export function useEvent<T extends (...args: any) => any>(handler: T): T {
  const handlerRef = useRef<T>(handler)

  useIsomorphicLayoutEffect(() => {
    handlerRef.current = handler
  })

  return useCallback((...args: Parameters<T>) => {
    const fn = handlerRef.current
    return fn(...args)
  }, []) as T
}
