import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { VariantProps } from "class-variance-authority"

export type ToastProps = React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
  variant?: "default" | "destructive" | "success"
}

export type ToastActionElement = React.ReactElement<typeof ToastPrimitives.Action>

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
} 