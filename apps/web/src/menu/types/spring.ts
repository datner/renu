import { AnimatedProps } from "@react-spring/web"
import { ComponentProps } from "react"

export type AnimatedStyle = AnimatedProps<ComponentProps<"div">>["style"]
