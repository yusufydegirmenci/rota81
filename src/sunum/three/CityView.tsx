import { useMemo } from 'react'
import { Viewer3D } from './Viewer3D'
import { buildCity, buildStreet, citySteps, streetSteps } from './cityScene'
import type { Quality } from './SceneManager'
import type { DLine, DStop } from '../citydesign'

export function CityView({ stops, lines, quality }: { stops: DStop[]; lines: DLine[]; quality: Quality }) {
  const steps = useMemo(() => citySteps(stops, lines), [stops, lines]); const build = useMemo(() => buildCity(stops, lines), [stops, lines])
  return <Viewer3D steps={steps} build={build} label="3D model of Marisa with your stops and lines" quality={quality} holdMs={7000} />
}
export function StreetViewer({ riders, status, quality }: { riders: number; status: string; quality: Quality }) {
  const steps = useMemo(() => streetSteps(riders, status), [riders, status]); const build = useMemo(() => buildStreet(Math.round(riders / 400)), [riders])
  return <Viewer3D steps={steps} build={build} label="Street-level view of a stop at rush hour" quality={quality} holdMs={7000} />
}
