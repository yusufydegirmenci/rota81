# PROVA (rehearsal checklist)

Same content is inside the app: Rehearsal tab and the presenter window ("Rehearsal checklist and likely questions"). Source: `src/sunum/prova.ts`.

## Before the day
- [ ] Laptop charged, charger packed, battery saver off
- [ ] **No internet?** Open `public/rota81-sunum.pdf` (one slide per page, static pictures). Also works: `npm run build`, then open `dist/index.html` (HashRouter uses `#`, base is `./`; if a browser blocks file:// modules, run `npx vite preview`)
- [ ] Full screen (F) works; presenter window opens on the second screen
- [ ] Sound checked (optional: the talk works without it)
- [ ] Safe mode tested once: add `?safe=1` to the address or press "Safe mode"; every slide shows text and pictures
- [ ] PDF on a USB stick and on the phone

## Keys (PowerPoint style)
←/→, PageUp/PageDown, Space, Enter = next/back; Backspace = back; Home/End; F full screen; Esc exit; B or . blank the screen; type a number then Enter to jump to a slide.

## Time plans
10 min: core slides + tap scene. 20 min: core + journey + restaurant. 30 min: all chapters (tours and city design as a short demo).

## Likely questions (short answers; full answers in the Question lab, `qa.ts`)
- **Hardest words to translate?** Words with two meanings. I fixed one Turkish term per English term (authorisation: yetkilendirme / ödeme onayı; validator vs reader).
- **Real or simulated?** Stops, lines, photos: open data. Payments, balances, vehicles: simulation. Labels REAL / DESIGN / SIMULATION on screen.
- **Privacy and security?** Data minimisation, role-based access, logs; keys stay in the secure element; KVKK/GDPR as reference.
- **Cost?** Readers, platform, cards, support; no verified price figure for this prototype.
- **Sustainability?** Fewer paper tickets, reusable card, rail instead of car; carbon figure is a rough estimate.
- **Offline?** The bus keeps working, stores signed taps and uploads them in order.
- **Limits?** Prototype only: no real payments, no operator integration, estimates for fares and times.
