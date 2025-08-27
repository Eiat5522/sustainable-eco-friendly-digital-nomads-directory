
'use client'

import { ReactNode } from 'react'
import ErrorBoundary, { type FallbackProps } from '@kombai/react-error-boundary'

interface PreviewWrapperProps {
  children: ReactNode
}

export default function PreviewWrapper({ children }: Readonly<PreviewWrapperProps>) {
  return (
    <ErrorBoundary
      onError={(error, info) => {
        console.error('Preview rendering failed:', error, info)
      }}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div role="alert" className="preview-error">
          <p>Something went wrong while rendering the preview.</p>
         {process.env.NODE_ENV !== 'production' && error?.message && (
            <p className="preview-error-details">{error.message}</p>
          )}
          <button type="button" autoFocus onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <div className="preview-container">
        {children}
      </div>
    </ErrorBoundary>
  )
}

