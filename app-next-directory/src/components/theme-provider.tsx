"use client"

import { ThemeProvider as NextThemesProvider, ThemeProviderProps } from "next-themes"
import * as React from "react"

export function ThemeProvider(props: ThemeProviderProps) {
  const { children, ...rest } = props
  return <NextThemesProvider {...rest}>{children}</NextThemesProvider>
}
