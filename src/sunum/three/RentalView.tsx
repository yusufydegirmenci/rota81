import { Viewer3D } from './Viewer3D'
import { RENTAL_STEPS, buildRental } from './rentalScene'
import type { Quality } from './SceneManager'

export function RentalView({ quality }: { quality: Quality }) {
  return <Viewer3D steps={RENTAL_STEPS} build={buildRental} label="3D car rental by card (simulation): find, unlock, drive, return, charge, settle" quality={quality} holdMs={6500} />
}
