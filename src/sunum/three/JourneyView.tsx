import { Viewer3D } from './Viewer3D'
import { JOURNEY_STEPS, buildJourney } from './journey'
import type { Quality } from './SceneManager'

export function JourneyView({ quality }: { quality: Quality }) {
  return <Viewer3D steps={JOURNEY_STEPS} build={buildJourney} label="3D journey: Derya from home to the bus, a validator failure and the metro" quality={quality} holdMs={6500} />
}
