import { useSyncExternalStore } from 'react'

/** Safe mode: no WebGL, particles or sound; clean static slides. Enabled by ?safe=1, remembered in localStorage. */
const KEY = 'rota81-safe'
export const safeFromUrl = (s: string) => /[?&]safe=1(?:&|$|#)/.test(s)
const read = () => { try { return safeFromUrl(location.search + location.hash + '#') || localStorage.getItem(KEY) === '1' } catch { return false } }
let on = read()
const subs = new Set<() => void>()
export const isSafe = () => on
export function setSafe(v: boolean) { on = v; try { localStorage.setItem(KEY, v ? '1' : '0') } catch { /* storage unavailable */ } subs.forEach((f) => f()) }
export const useSafe = () => useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb) }, isSafe)
export function webglOk() { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false } }
