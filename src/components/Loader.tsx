/**
 * Loading state tied to real readiness (textures generated, shaders compiled,
 * first frames drawn). Progress is not measurable in useful steps, so the
 * indicator is an honest indeterminate line rather than a fake percentage.
 */
export function Loader({ visible }: { visible: boolean }) {
  return (
    <div className="loader" data-visible={visible} role="status" aria-live="polite">
      <span className="loader__mark">FORM / FIELD</span>
      <span className="loader__text">{visible ? 'Preparing the residence' : 'Scene ready'}</span>
      <span className="loader__line" aria-hidden="true" />
    </div>
  )
}
