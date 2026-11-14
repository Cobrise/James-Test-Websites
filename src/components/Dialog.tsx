import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  className?: string
}

/**
 * Modal dialog on the native <dialog> element: the browser provides the focus
 * trap, inert background and Escape handling. Focus returns to whatever opened
 * it. Clicking the backdrop closes it.
 */
export function Dialog({ open, onClose, labelledBy, children, className = '' }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const opener = useRef<Element | null>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      opener.current = document.activeElement
      d.showModal()
      document.documentElement.dataset.dialogOpen = 'true'
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && d.open) {
      d.close()
    }
  }, [open])

  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onClosed = () => {
      delete document.documentElement.dataset.dialogOpen
      ;(opener.current as HTMLElement | null)?.focus?.()
      onClose()
    }
    d.addEventListener('close', onClosed)
    return () => d.removeEventListener('close', onClosed)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      className={`dialog ${className}`}
      aria-labelledby={labelledBy}
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close()
      }}
    >
      <div className="dialog__inner">
        <button type="button" className="dialog__close" onClick={() => ref.current?.close()} data-autofocus>
          Close<span className="visually-hidden"> dialog</span>
        </button>
        {children}
      </div>
    </dialog>
  )
}
