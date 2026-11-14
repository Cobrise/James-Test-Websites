import { useCallback, useEffect, useRef, useState } from 'react'

export const navItems = [
  { href: '#work', label: 'Selected work' },
  { href: '#approach', label: 'Approach' },
  { href: '#studio', label: 'Studio' },
  { href: '#contact', label: 'Contact' },
]

/**
 * Persistent header. On narrow screens the links move into a full-screen menu
 * with a correct expanded state, focus moved into the menu on open, a focus
 * loop while open, Escape to dismiss and focus returned to the toggle.
 */
export function Header() {
  const [open, setOpen] = useState(false)
  const [solid, setSolid] = useState(false)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) toggleRef.current?.focus()
  }, [])

  useEffect(() => {
    const cinema = document.getElementById('cinema')
    const on = () => {
      const end = cinema ? cinema.offsetTop + cinema.offsetHeight - window.innerHeight * 1.05 : 200
      setSolid(window.scrollY > end)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const menu = menuRef.current
    const focusables = () => Array.from(menu?.querySelectorAll<HTMLElement>('a, button') ?? [])
    focusables()[0]?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      } else if (e.key === 'Tab') {
        const items = [toggleRef.current!, ...focusables()]
        const i = items.indexOf(document.activeElement as HTMLElement)
        const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1
        e.preventDefault()
        items[next]?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.documentElement.dataset.menuOpen = 'true'
    return () => {
      document.removeEventListener('keydown', onKey)
      delete document.documentElement.dataset.menuOpen
    }
  }, [open, close])

  // Close the menu if the viewport grows past the breakpoint.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 861px)')
    const on = () => mq.matches && setOpen(false)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return (
    <header className="site-header" data-solid={solid} data-open={open}>
      <a className="skip-link" href="#overview">
        Skip cinematic introduction
      </a>
      <a className="wordmark" href="#top" aria-label="FORM / FIELD — back to the beginning">
        FORM <span aria-hidden="true">/</span> FIELD
      </a>
      <nav className="site-nav" aria-label="Primary">
        <ul>
          {navItems.map((n) => (
            <li key={n.href}>
              <a href={n.href}>{n.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <button
        ref={toggleRef}
        type="button"
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="menu-toggle__label">{open ? 'Close' : 'Menu'}</span>
        <span className="menu-toggle__bars" aria-hidden="true" />
      </button>
      <div id="mobile-menu" className="mobile-menu" ref={menuRef} hidden={!open}>
        <nav aria-label="Primary (menu)">
          <ol>
            {navItems.map((n, i) => (
              <li key={n.href}>
                <a href={n.href} onClick={() => close(false)}>
                  <span className="mobile-menu__num">{String(i + 1).padStart(2, '0')}</span>
                  {n.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <p className="mobile-menu__note">Stillwater House — a concept residence</p>
      </div>
    </header>
  )
}
