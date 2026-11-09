import { useMemo } from 'react'
import { Viewer3D } from './Viewer3D'
import { RESTAURANT_STEPS, buildRestaurant } from './restaurant'
import type { Quality } from './SceneManager'

const TOUR = RESTAURANT_STEPS.slice(0, 5), PAY = RESTAURANT_STEPS.slice(5)
const BUILD_TOUR = buildRestaurant(0), BUILD_PAY = buildRestaurant(5)

/** `part` = 'tour' for the restaurant visit slide (steps 1-5) or 'pay' for the payment slide (steps 6-11). */
export function RestaurantView({ quality, part }: { quality: Quality; part: 'tour' | 'pay' }) {
  const props = useMemo(() => (part === 'tour' ? { steps: TOUR, build: BUILD_TOUR } : { steps: PAY, build: BUILD_PAY }), [part])
  return <Viewer3D {...props} label={part === 'tour' ? '3D restaurant: outside, entrance, inside and menu' : '3D card payment: POS, authorisation and settlement (simulation)'} quality={quality} holdMs={6500} />
}
