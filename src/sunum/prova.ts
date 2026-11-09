import { QA_LIST } from './qa'

/** Rehearsal data shared by ops/PROVA.md, the rehearsal tab and the presenter window. Keep ops/PROVA.md in step with this file. */
export const PROVA_CHECKLIST = [
  'Laptop charged and charger packed; battery saver off',
  'No-internet plan: open the PDF (public/rota81-sunum.pdf) and the offline build; test with Wi-Fi off',
  'Full screen (F) works; presenter window opens on the second screen',
  'Sound level checked; sound is optional, the talk works without it',
  'Safe mode tested once (?safe=1): every slide shows text and pictures',
  'Backup: PDF on a USB stick and on the phone',
  'Know the time plan: 10, 20 or 30 minutes',
]
export const PROVA_PLANS = ['10 min: core slides only, one 3D scene (tap)', '20 min: core slides plus journey and restaurant', '30 min: all chapters, tours and city design as a short demo']
const PICK = ['Which words were hardest to translate', 'What is real in this project', 'How is privacy protected for tourists', 'What would this system cost', 'Is the project sustainable', 'How is passenger data protected', 'What are the main limitations']
export const PROVA_QA = QA_LIST.filter((x) => PICK.some((p) => x.q.startsWith(p))).map((x) => ({ q: x.q, a: x.short }))
