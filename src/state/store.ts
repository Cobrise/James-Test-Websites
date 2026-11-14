import { useSyncExternalStore } from 'react'
import type { TimberFinishId } from '../scene/materials/presets'

/**
 * Tiny external store for state shared between the DOM and the WebGL scene.
 * Values change rarely (selection, readiness), never per frame — per-frame
 * values such as scroll progress live in scroll/progress.ts as plain refs.
 */
export type SceneStatus = 'idle' | 'loading' | 'ready' | 'failed'

interface State {
  timberFinish: TimberFinishId
  sceneStatus: SceneStatus
  activeChapter: number
}

let state: State = { timberFinish: 'smoked', sceneStatus: 'idle', activeChapter: 0 }
const listeners = new Set<() => void>()

export function getState() {
  return state
}

export function setState(patch: Partial<State>) {
  const next = { ...state, ...patch }
  if ((Object.keys(patch) as (keyof State)[]).every((k) => next[k] === state[k])) return
  state = next
  listeners.forEach((l) => l())
}

export function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state), () => select(state))
}
