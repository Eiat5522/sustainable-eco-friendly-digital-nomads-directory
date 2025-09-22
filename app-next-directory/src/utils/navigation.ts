export const getCurrentHref = (): string => {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.location.href
}

export const redirectTo = (target: string) => {
  if (typeof window !== 'undefined') {
    window.location.href = target
  }
}
