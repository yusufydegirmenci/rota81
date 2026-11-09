import type { Slide } from './types'

export const PART5: Slide[] = [
  { id: 'tours', chapter: '11 · Restaurant and Retail', title: 'Ready-Made Tours and Guide Options', core: false,
    bullets: ['Four ready tours built from the tour data', 'Audio guide, local guide or self-paced', 'Places, food prices and times from the data, rail fares marked as estimates'],
    script: ['Not everyone wants to plan.', 'These four tours are cut from the same data as the tour page.', 'Pick a tour, pick how you want to be guided, and step through the stops.', 'Everything is simulated: nothing is booked and no money moves.'],
    notes: 'Tours are slices of the existing Turkey tour (Istanbul, Kocaeli, Ankara, Konya). Place text and photos come from the tour data with licences; food prices are the demo prices of that data; rail fares are estimates (TAHMİN). Local fares are charged by each city tariff in the platform and are not part of the tour data, so they are not shown. A local guide’s price is set by the guide, so none is invented.',
    scene: { k: 'tours' }, terms: [], transition: 'Tours show how one card connects many places; next, how a city can be designed.' },
]
