import type { Slide } from './types'

export const PART5: Slide[] = [
  { id: 'tours', chapter: '11 · Restaurant and Retail', title: 'Ready-Made Tours and Guide Options', core: false,
    bullets: ['Four ready tours built from the tour data', 'Audio guide, local guide or self-paced', 'Places, food prices and times from the data, rail fares marked as estimates'],
    script: ['Not everyone wants to plan.', 'These four tours are cut from the same data as the tour page.', 'Pick a tour, pick how you want to be guided, and step through the stops.', 'Everything is simulated: nothing is booked and no money moves.'],
    notes: 'Tours are slices of the existing Turkey tour (Istanbul, Kocaeli, Ankara, Konya). Place text and photos come from the tour data with licences; food prices are the demo prices of that data; rail fares are estimates (TAHMİN). Local fares are charged by each city tariff in the platform and are not part of the tour data, so they are not shown. A local guide’s price is set by the guide, so none is invented.',
    scene: { k: 'tours' }, terms: [], transition: 'Tours show how one card connects many places; next, how a city can be designed.' },
  { id: 'design-city', chapter: '2 · The City and Its People', title: 'Design Your Own Network for Marisa', core: false,
    bullets: ['Place stops, draw lines, set the headway', 'See coverage, line load and connectivity at once', 'Six map views and a real-data check'],
    script: ['Now you are the planner.', 'Place stops where people live, draw lines between them and choose how often vehicles come.', 'The result panel shows who is served and which lines are overloaded.', 'Switch to 3D and street view to see what the numbers mean for people.'],
    notes: 'Marisa’s populations and the 1.5% peak-hour trip rate are scenario assumptions (SCENARIO), not statistics. Vehicle capacities are design values. The "Real data" tab reads the open-data stops in src/data/real (read only) and says "veri yok" for provinces without data; it never invents stops.',
    scene: { k: 'design' }, terms: [], transition: 'A designed network still has to be run every day: operations next.' },
]
