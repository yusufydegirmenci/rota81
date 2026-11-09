export type Tag = 'LOCAL' | 'BACKEND' | 'PHYSICAL' | 'SIMULATED' | 'STANDARD' | 'DESIGN'

export interface FlowNode { id: string; label: string; sub?: string; x: number; y: number; w?: number; kind?: 'device' | 'service' | 'data' | 'actor' | 'ext' }
export interface FlowStep { active: string[]; edges?: [string, string][]; title: string; text: string; tag?: Tag; data?: string; fail?: string[] }
export interface Flow { nodes: FlowNode[]; edges: [string, string][]; steps: FlowStep[]; height?: number }

export type Scene =
  | { k: 'none' }
  | { k: 'street'; steps: { title: string; text: string }[] }
  | { k: 'flow'; flow: Flow }
  | { k: 'card' }
  | { k: 'nfc' }
  | { k: 'restaurant' }
  | { k: 'tech' }
  | { k: 'map' }
  | { k: 'dash' }
  | { k: 'cards'; items: { h: string; t: string; tag?: Tag }[] }
  | { k: 'table'; head: string[]; rows: string[][] }

export interface Slide {
  id: string
  chapter: string
  title: string
  /** Layer A: concise audience text */
  bullets: string[]
  /** Layer B: spoken script, one sentence per entry */
  script: string[]
  /** Layer C: advanced notes */
  notes: string
  scene: Scene
  terms?: string[]
  emphasize?: string
  pause?: string
  transition?: string
  core?: boolean
  check?: { q: string; a: string }
}

export interface Term { en: string; tr: string; def: string; ctx: string; ex: string; alt?: string; mistake?: string; ipa?: string; say: string }
export interface QA { level: 'Beginner' | 'Intermediate' | 'Advanced'; q: string; short: string; deep: string; example: string; terms: string[]; follow: string }
