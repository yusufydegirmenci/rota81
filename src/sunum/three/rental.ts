/** Car rental by card (SIMULATION). Generic operator, demo tariff in TRY, no real payment. Pure functions so the numbers on screen are testable. */
export const TARIFF = { operator: 'Rental Operator A', unlock: 1.0, perMinute: 0.35, dailyCap: 60, hold: 50, currency: 'TRY' } as const

const r2 = (n: number) => Math.round(n * 100) / 100
export interface Quote { fee: number; capped: boolean; release: number; extra: number }

/** Fee for a rental of `minutes` (unlock fee + per-minute, limited by the daily cap) and what happens to the pre-authorisation hold. */
export function quote(minutes: number, t = TARIFF): Quote {
  if (!(minutes >= 0)) throw new Error('minutes must be >= 0')
  const raw = t.unlock + t.perMinute * Math.ceil(minutes)
  const fee = r2(Math.min(raw, t.dailyCap))
  return { fee, capped: raw > t.dailyCap, release: r2(Math.max(t.hold - fee, 0)), extra: r2(Math.max(fee - t.hold, 0)) }
}
export const fmt = (n: number) => `${n.toFixed(2)} ${TARIFF.currency}`

export interface RentalStep { title: string; text: string; deep: string }
export const RENTAL_COPY: RentalStep[] = [
  { title: 'Find a car', text: 'Cars of the fictional "Rental Operator A" stand along the kerb. The app shows free cars on a map; here we see the lot from above (SIMULATION).', deep: 'The operator, not the transit platform, owns the cars. The transit card is only the identity and payment instrument.' },
  { title: 'Choose a car', text: 'Derya picks the compact electric car. The price list is shown before she commits: unlock fee, price per minute, daily cap (demo values).', deep: 'Price transparency before unlock is a fairness requirement; the tariff is a version stored with the trip, so later tariff changes do not alter it.' },
  { title: 'Unlock by tapping the card', text: 'She taps the card on the reader at the windscreen. Same radio physics as the bus: the reader powers the card and they exchange bits.', deep: 'The car reader and card use a rental application on the card, separate from the transit application, with its own keys.' },
  { title: 'Backend: identity and pre-authorisation', text: 'The operator platform checks the account and asks the issuer for a pre-authorisation hold of 50.00 TRY. A hold reserves money; it does not take it (SIMULATION).', deep: 'Pre-authorisation covers the likely cost. The final charge can be lower (hold released) or higher (extra authorisation).' },
  { title: 'Unlocked', text: 'The lights flash and the doors unlock. The trip clock starts now.', deep: 'The unlock command is sent to the car over the mobile network, or checked locally if the car is offline.' },
  { title: 'Drive: time and fee', text: 'While she drives, the meter shows elapsed time and the running fee. It follows the tariff: unlock fee plus price per minute, up to the daily cap.', deep: 'The meter is a display. The authoritative fee is computed by the platform from the trip start and end times.' },
  { title: 'Return and lock', text: 'She parks in the operator bay and taps the card again to end the trip. The car locks and the clock stops.', deep: 'Ending requires a valid parking position; otherwise the platform refuses to end the trip and tells her why.' },
  { title: 'Final charge', text: 'The platform computes the final fee, captures it from the hold and releases the rest of the hold. If the fee were above the hold, an extra authorisation would be requested.', deep: 'Capture = turning the reserved money into a charge. Release = returning the unused part. Both are recorded in the ledger.' },
  { title: 'Settlement and reconciliation', text: 'Later, settlement moves the money to Rental Operator A (grey lane). Reconciliation checks that every unlocked trip has a charge and every charge has a trip.', deep: 'Clearing, settlement and reconciliation are separate from the authorisation you saw earlier, just like in the restaurant payment.' },
]
