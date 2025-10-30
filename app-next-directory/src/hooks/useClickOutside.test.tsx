/** @jest-environment jsdom */
import { fireEvent, render } from '@testing-library/react'
import { useRef } from 'react'
import { useClickOutside } from './useClickOutside'

type Handler = () => void

function HookHarness({ handler }: { handler: Handler }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  useClickOutside(containerRef, handler)

  return (
    <div data-testid="outer">
      <div data-testid="inner" ref={containerRef} />
    </div>
  )
}

describe('useClickOutside', () => {
  it('invokes the handler when an external target is clicked', () => {
    const handler = jest.fn()
    const { getByTestId } = render(<HookHarness handler={handler} />)

    fireEvent.mouseDown(getByTestId('outer'))

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not invoke the handler when clicking inside the referenced element', () => {
    const handler = jest.fn()
    const { getByTestId } = render(<HookHarness handler={handler} />)

    fireEvent.mouseDown(getByTestId('inner'))

    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores events when the ref is null', () => {
    const handler = jest.fn()

    const NullHarness = () => {
      const ref = useRef<HTMLDivElement | null>(null)
      useClickOutside(ref, handler)
      return <div data-testid="outer" />
    }

    const { getByTestId, unmount } = render(<NullHarness />)

    fireEvent.mouseDown(getByTestId('outer'))
    expect(handler).not.toHaveBeenCalled()

    unmount()
  })

  it('treats non-Node event targets as outside clicks', () => {
    const handler = jest.fn()
    render(<HookHarness handler={handler} />)

    const event = new MouseEvent('mousedown', { bubbles: true })
    Object.defineProperty(event, 'target', {
      value: { arbitrary: 'value' },
      configurable: true,
    })

    document.dispatchEvent(event)

    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('cleans up document listeners on unmount', () => {
    const handler = jest.fn()

    const Wrapper = ({ handler }: { handler: Handler }) => {
      const innerRef = useRef<HTMLDivElement | null>(null)
      useClickOutside(innerRef, handler)
      return <div ref={innerRef} data-testid="inner" />
    }

    const { unmount } = render(<Wrapper handler={handler} />)
    unmount()

    fireEvent.mouseDown(document.body)

    expect(handler).not.toHaveBeenCalled()
  })
})
