import type { Slide } from './types'

/** Every time below is a planning estimate, not a measured journey. Line and stop names must be checked against each city's own timetable before presenting. */
const DAY_HEAD = ['When', 'Where', 'How we get there', 'Est. time']
const NOTE_DAY = 'Planning estimates only: walking and riding times were not measured and no fares are quoted. Check line numbers, stop names and opening days against the city\'s own timetable before presenting. Museum prices and entry rules belong to the museum authority, not to this project.'
const day = (id: string, city: string, tagline: string, rows: string[][], script: string[]): Slide => ({
  id, chapter: '12 · One Day, One Card', title: `${city}: One Day on One Card`, core: false,
  bullets: [tagline, 'Morning, midday and evening, with the vehicle for each leg', 'Times are planning estimates'],
  script, notes: NOTE_DAY,
  scene: { k: 'table', head: DAY_HEAD, rows, reveal: true },
  terms: [], transition: 'One city in a day; the next slide moves to the next city.',
})

export const PART6: Slide[] = [
  { id: 'route-cities', chapter: '12 · One Day, One Card', title: 'Five Cities, One Card', core: false,
    bullets: ['İstanbul, Ankara, Eskişehir, İzmir, Antalya', 'Each city gets one planned day', 'The card stays the same; the city tariff changes'],
    script: ['The tour pages use five cities.', 'They differ a lot: a ferry city, a capital, a tram city, a harbour and a resort.', 'For each one we plan a single day and name the vehicle for every leg.'],
    notes: 'City positions are drawn from real coordinates but the map is schematic. Local fares are charged by each city\'s own tariff in the platform and are not shown here.',
    scene: { k: 'route' }, terms: [], transition: 'Start with İstanbul.' },

  day('day-istanbul', 'İstanbul', 'Water in the morning, old city at noon, İstiklal at night', [
    ['Morning', 'Eminönü, Mısır Çarşısı, a simit from the stand outside', 'Ferry or tram T1 to Eminönü', '~40 min'],
    ['Midday', 'Süleymaniye Mosque, then lunch near the bazaar', 'On foot uphill from Eminönü', '~15 min walk'],
    ['Afternoon', 'Kapalıçarşı, Sultanahmet or Topkapı Palace', 'Tram T1 and walking', '~3 h on site'],
    ['Evening', 'Karaköy or Kadıköy ferry, İstiklal Caddesi', 'Ferry, then the Beyoğlu funicular or walking', '~30 min crossing'],
  ], ['İstanbul is the city where the boat is part of the commute.', 'The day starts on the water because the ferry crossing is the best first impression and costs one tap.', 'Midday is spent uphill and on foot; the card is only needed again for the tram.', 'In the evening the ferry to Kadıköy or Karaköy ends the day on the water as well.']),

  day('day-ankara', 'Ankara', 'The republic in the morning, old streets in the afternoon', [
    ['Morning', 'Anıtkabir, including the museum under the mausoleum', 'Metro or Ankaray toward Tandoğan, then a walk', '~25 min + 15 min walk'],
    ['Midday', 'Lunch with Ankara tava near Ulus', 'Bus or metro to Ulus', '~25 min'],
    ['Afternoon', 'Museum of Anatolian Civilizations and Ankara Castle', 'On foot from Ulus, uphill', '~2.5 h on site'],
    ['Evening', 'Hamamönü houses and cafés, or Kuğulu Park', 'On foot, then a bus back', '~1.5 h'],
  ], ['Ankara is built around a few big sites, so the day is a loop.', 'Anıtkabir comes first because it is the one place that needs a clear morning.', 'After lunch everything old sits within walking distance of Ulus.', 'Hamamönü is the evening stop; Kuğulu Park is the quiet alternative.']),

  day('day-eskisehir', 'Eskişehir', 'A tram city, so the tram is the plan', [
    ['Morning', 'Odunpazarı houses and the Odunpazarı Modern Museum', 'City tram toward Odunpazarı, then walking', '~20 min + walking'],
    ['Midday', 'Lunch with çibörek, then the meerschaum (lületaşı) museum', 'On foot in the old quarter', '~1.5 h'],
    ['Afternoon', 'Sazova Park', 'City tram', '~25 min'],
    ['Evening', 'Porsuk river walk and Kentpark', 'Tram back toward the centre, then walking', '~1.5 h'],
  ], ['Eskişehir is small enough that the tram does most of the work.', 'The old quarter fills the morning and lunch.', 'Sazova is a half-day trip of its own, so it gets the afternoon.', 'The river and Kentpark close the day; nothing needs a car.']),

  day('day-izmir', 'İzmir', 'Harbour first, ruins second, waterfront to finish', [
    ['Morning', 'Konak Square and the clock tower, then the Agora ruins', 'Metro or ferry to Konak, then walking or a bus', '~30 min'],
    ['Midday', 'Kemeraltı bazaar lunch', 'On foot from Konak', '~1 h'],
    ['Afternoon', 'Kadifekale for the view of the bay', 'Bus from Konak', '~25 min'],
    ['Evening', 'Kordon at sunset', 'Back down by bus, then walking', '~1.5 h'],
  ], ['İzmir is organised around the bay, so the day follows it.', 'Konak and the Agora are close enough to share a morning.', 'Kadifekale is the one steep leg, and it is the view people remember.', 'Ephesus is a separate full day by regional train and bus, so it is left out here.']),

  day('day-antalya', 'Antalya', 'Old town by tram, waterfall for the heat of the day', [
    ['Morning', 'Kaleiçi old town and the harbour', 'Heritage tram, then walking', '~20 min + walking'],
    ['Midday', 'Antalya Museum, then lunch', 'Modern tram line', '~20 min'],
    ['Afternoon', 'Upper Düden waterfalls', 'City bus', '~35 min'],
    ['Evening', 'Back to Kaleiçi or the sea cliffs', 'Bus and tram', '~35 min'],
  ], ['Antalya has two trams, an old one for the postcard and a modern line for getting around.', 'The old town is best early, before the heat.', 'The museum and the waterfall are both cool and indoors or shaded.', 'Aspendos and Perge are day trips of their own and need a separate plan.']),

  { id: 'compare', chapter: '13 · Where This Fits', title: 'What a Türkiye Card Already Does, and What This Adds', core: false,
    bullets: ['A transit card already exists; this project does not replace its job', 'The added part is the visitor: one app, history, languages', 'The right-hand column is a design proposal, not a product'],
    script: ['The most likely question is: we already have a Türkiye card, so why this.', 'Our answer is that paying a fare is solved, and the visitor side is not.', 'A tourist should not need a different card, app and language in every city.', 'We propose one app with the trip history and the languages on top of the existing fare payment.'],
    notes: 'The left column states what an existing city or national transit card is built to do and makes no claim about any specific product\'s features or prices. Verify specifics for the card you name in the room before saying them aloud. The right column is the project proposal and is simulated.',
    scene: { k: 'table', head: ['Topic', 'An existing transit card', 'This project (proposal)'], reveal: true, rows: [
      ['Main job', 'Pay the fare in the city that issued it', 'Same, plus the visitor trip around it'],
      ['Visitor experience', 'Learned city by city', 'One app and one flow in every demo city'],
      ['App', 'Varies by city', 'A single app'],
      ['Trip history', 'Mostly balance and last uses', 'Trip history the traveller can read and delete'],
      ['Languages', 'Usually Turkish, sometimes English', 'Turkish, English, Arabic and German in card text, app and announcements'],
      ['Museums and tours', 'Handled by separate cards or tickets', 'A possible link to museum entry and tours (see tourism slide)'],
    ] },
    terms: [], transition: 'Next: who the system has to work for.' },

  { id: 'groups', chapter: '13 · Where This Fits', title: 'Four Passengers, Four Different Days', core: false,
    bullets: ['Student, tourist, older passenger, passenger with a disability', 'Same card, different needs', 'Accessibility is part of the design from the start'],
    script: ['The same tap has to work for very different people.', 'A student wants the reduced fare to apply without queueing for it.', 'A tourist wants to know the stop in a language they can read.', 'An older passenger needs a clear screen and enough time at the validator.', 'A passenger with a disability needs step-free routes and spoken announcements.'],
    notes: 'Concession rules (student, senior, disability) are set by each city; the project only shows how they would be attached to the card. Accessibility items follow common transit practice: step-free stop data, audio announcements, large type, a tactile mark on the card, screen-reader support in the app.',
    scene: { k: 'cards', reveal: true, items: [
      { h: 'Student', t: 'Concession fare is attached to the account once and applied at every tap, so there is no separate card to carry.', tag: 'DESIGN' },
      { h: 'Tourist', t: 'Stop names and messages in the traveller\'s language, a visit history, and a simple way to check the balance before leaving.', tag: 'DESIGN' },
      { h: 'Older passenger', t: 'Large type, a longer time on the validator screen and a clear sound. A person can still pay at a counter.', tag: 'DESIGN' },
      { h: 'Passenger with a disability', t: 'Step-free stops in route search, spoken next-stop announcements, a tactile mark on the card and an app that works with a screen reader.', tag: 'DESIGN' },
    ] },
    terms: [], transition: 'Language is the biggest barrier for visitors, so it gets its own slide.' },

  { id: 'languages', chapter: '13 · Where This Fits', title: 'The Card Speaks the Passenger\'s Language', core: false,
    bullets: ['Turkish, English, Arabic and German', 'The validator message, the app and the announcement must agree', 'Arabic is right-to-left, which changes the layout'],
    script: ['Language is where translation work meets the card.', 'The same short message has to be clear on a tiny validator screen, in the app and over a loudspeaker.', 'Short messages are harder to translate than long ones because there is no context.', 'Every item here would be checked by a native speaker before use.'],
    notes: 'Phrases are standard short transit messages written for this slide and must be reviewed by a native speaker (especially the Arabic and German) before use. Arabic needs right-to-left layout and, on a small validator display, enough font support for joined letters. Place names keep their Turkish form and the translation goes beside them, never in place of them. Good translation topics: register (formal "okutunuz" vs informal), length limits on a four-line display, and one stable term per concept ("transfer", not three synonyms).',
    scene: { k: 'table', head: ['Turkish', 'English', 'German', 'Arabic'], reveal: true, rows: [
      ['Kartınızı okutunuz', 'Please tap your card', 'Bitte Karte vorhalten', 'يرجى تقريب البطاقة من القارئ'],
      ['Bir sonraki durak', 'Next stop', 'Nächste Haltestelle', 'المحطة التالية'],
      ['Bakiye yetersiz', 'Insufficient balance', 'Guthaben nicht ausreichend', 'الرصيد غير كافٍ'],
      ['İyi yolculuklar', 'Have a good trip', 'Gute Fahrt', 'رحلة سعيدة'],
    ] },
    terms: ['Localisation'], transition: 'Language also helps the local economy, which leads to tourism.' },

  { id: 'tourism', chapter: '13 · Where This Fits', title: 'Museums, Tours and Local Shops: What Could Be Possible', core: false,
    bullets: ['All of this is a proposal, not an agreement', 'One tap for transport and one for entry', 'Prices and rules would be set by the museum, guide or shop'],
    script: ['Here we only describe what could be possible.', 'A visitor today may need a museum card for one place, a separate ticket for another and a transit card for the bus.', 'With one card the idea is that the transport tap and the entry tap are the same gesture.', 'The terms, such as price or opening hours, belong to the museum, the tour operator or the shop. We do not set them.'],
    notes: 'Presenter: if you have your own recent example, for instance what you paid and what you needed at a real entrance with the card you actually carry, this is the place to say it. The slide itself claims no price or discount. Any museum or tour offer would need an agreement with the museum authority or operator; a shop campaign would need the shop\'s consent and the city\'s rules on promotions.',
    scene: { k: 'cards', reveal: true, items: [
      { h: 'Museum entry', t: 'A museum could accept the card as a ticket on its own terms, so a visitor does not need a separate museum card.', tag: 'DESIGN' },
      { h: 'Guided tours', t: 'A tour could be booked and paid with the same account, with the guide setting the price.', tag: 'DESIGN' },
      { h: 'Local shops', t: 'A neighbourhood campaign could point visitors to small shops near a stop. The shop decides whether to take part.', tag: 'DESIGN' },
      { h: 'Why it helps', t: 'Visitors spend less time on tickets and more time in the place; local businesses are easier to find.', tag: 'DESIGN' },
    ] },
    terms: [], transition: 'Next: what each party would have to take on.' },

  { id: 'cost-benefit', chapter: '13 · Where This Fits', title: 'Who Carries What', core: false,
    bullets: ['No figures: only who takes on what and what they get', 'Real costs would come from a pilot and from suppliers', 'Every party needs a reason to join'],
    script: ['We do not put numbers here because we do not have real ones.', 'What we can say is who would have to take something on and what they would get back.', 'The transit operator takes on the hardware and the integration.', 'The city and the visitor are the ones who gain most, so the arrangement has to be fair to the operator.'],
    notes: 'No amounts, savings or payback periods appear on purpose. They would be invented, and a reviewer can ask where they came from. The honest next step is a small pilot with a supplier quote and a measured sample of trips.',
    scene: { k: 'table', head: ['Who', 'What they take on', 'What they get'], reveal: true, rows: [
      ['Transit operator', 'Validators, integration, staff training', 'Faster boarding data and fewer cash handling steps'],
      ['City / municipality', 'Coordination and data rules', 'Better trip data for planning, in aggregated form'],
      ['Museum or shop', 'A reader and an agreement', 'Visitors who find them more easily'],
      ['Visitor', 'Installing one app', 'One card, history and their own language'],
      ['Project team', 'Security and privacy work', 'A system that can be audited and improved'],
    ] },
    terms: [], transition: 'Last: the questions the audience is most likely to ask.' },

  { id: 'backup-qa', chapter: '14 · Backup', title: 'Backup: Ten Likely Questions', core: false,
    bullets: ['Short answers for the Q&A', 'Longer answers sit in the question bank', 'If you do not know, say what a pilot would measure'],
    script: ['These are backup answers, not for reading out.', 'Use them only if someone asks.'],
    notes: 'Answers are deliberately short. Every claim here is either a design decision of this project or a general statement about the technology; none of it is a measured result.',
    scene: { k: 'table', head: ['Question', 'Short answer'], reveal: true, rows: [
      ['Why not use a bank card or phone?', 'Many people do, and the system accepts them as another way to pay. A dedicated card still helps people without a bank account and keeps concessions simple.'],
      ['What if the network is down?', 'The validator keeps its rules locally, accepts the tap and sends the record later. The backend removes duplicates afterwards.'],
      ['Is the card safe to clone?', 'The card proves itself with keys, not just its number, and the backend can block a card. Nothing is claimed as unbreakable.'],
      ['Where does the balance live?', 'In the backend account, not on the plastic, so a lost card can be replaced without losing the balance.'],
      ['Who sees my trip history?', 'You do. Planning reports use aggregated, anonymised counts with a minimum group size.'],
      ['What about people without a smartphone?', 'The card works without the app and can be topped up at a counter.'],
      ['Why is it simulated?', 'No real payments or partners are involved, so nothing here moves real money.'],
      ['How is this different from İstanbulkart or a city card?', 'See the comparison slide: the fare is solved; the visitor experience across cities is the addition.'],
      ['Who pays for it?', 'See the cost slide: the burden is shared and no amounts are claimed.'],
      ['What would you do first in real life?', 'A small pilot on one line, measuring tap time, failures and complaints before anything is scaled.'],
    ] },
    terms: [], transition: 'End of backup.' },
]
