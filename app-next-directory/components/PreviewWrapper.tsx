
'use client'

import { ReactNode } from 'react'
import ErrorBoundary from '@kombai/react-error-boundary'

interface PreviewWrapperProps {
  children: ReactNode
}

export default function PreviewWrapper({ children }: PreviewWrapperProps) {
  return (
    <ErrorBoundary
      fallbackRender={({ resetErrorBoundary }) => (
        <div role="alert" className="preview-error">
          <p>Something went wrong while rendering the preview.</p>
          <button type="button" onClick={resetErrorBoundary}>Try again</button>
        </div>
      )}
    >
      <div className="preview-container">
        {children}
      </div>
    </ErrorBoundary>
  )
}

