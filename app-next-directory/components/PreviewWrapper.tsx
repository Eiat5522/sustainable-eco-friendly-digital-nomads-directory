'use client'

// Minimal client-safe typing to allow build-time inlining of NODE_ENV without exposing Node APIs.
declare const process: { env: { NODE_ENV: 'development' | 'production' | 'test' } };

import { ReactNode } from 'react'
import { RawErrorBoundary as ErrorBoundary, type FallbackProps } from '@kombai/react-error-boundary'

function PreviewFallback(props: Readonly<FallbackProps>) {
  const { error, resetErrorBoundary } = props
  return (
    <div role="alert" className="preview-error">
      <p>Something went wrong while rendering the preview.</p>
      {process.env.NODE_ENV !== 'production' && error?.message && (
        <p className="preview-error-details">{error.message}</p>
      )}
      <button type="button" autoFocus onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

interface PreviewWrapperProps {
  children: ReactNode
  fileId?: string
  content?: string
  previewOptions?: Record<string, unknown>
  previewInputHash?: string
}

export default function PreviewWrapper({
  children,
  fileId,
  content,
  previewOptions,
  previewInputHash
}: Readonly<PreviewWrapperProps>) {
  // Create reset keys based on preview inputs
  const resetKeys = previewInputHash
    ? [previewInputHash]
    : [
        fileId,
        content,
        // JSON.stringify may throw on circular structures; fall back to a sentinel string
        ((): string | undefined => {
          try {
            return previewOptions ? JSON.stringify(previewOptions) : undefined
          } catch {
            return '__previewOptions_stringify_error__'
          }
        })(),
      ].filter((v): v is string => v !== undefined)

  return (
    <ErrorBoundary
      resetKeys={resetKeys}
      onError={(error, info) => {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Preview rendering failed:', error, info)
        }
      }}
      fallbackRender={(props: FallbackProps) => <PreviewFallback {...props} />}
    >
      {children}
    </ErrorBoundary>
  )
}
