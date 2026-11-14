import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  onError: (error: unknown) => void
  fallback?: ReactNode
}

/** Catches render errors in the 3D scene so the page falls back to stills. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: unknown) {
    this.props.onError(error)
  }
  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
