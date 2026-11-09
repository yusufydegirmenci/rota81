# English audit (presentation text, terms.ts, qa.ts)

Method: grep for spelling variants and for competing terms across `src/sunum/**`, then fix to one form. Mixed British/American spelling was the main fault; British was chosen because it was already the majority (authorisation 47 vs 14).

| Before | After | Where |
|---|---|---|
| authorization / Authorization (14) | authorisation / Authorisation | qa.ts, terms.ts, content*.ts |
| organization (4) | organisation | content*.ts, scenes.tsx |
| tokenization (7) | tokenisation | qa.ts, terms.ts |
| synchronized / synchronization | synchronised / synchronisation | qa.ts |
| PCFSoftShadowMap (three.js warning) | PCFShadowMap | SceneManager.ts |

Terminology checks (no change needed): tap (130) is the passenger action and "touch" appears only for physical contact; validator (131) is the whole device and "reader" its radio part; fare (164) is the ride price and fee (57) is the merchant/service charge; top-up is hyphenated everywhere except one identifier; backend is one word (one "back-end" left in a quoted source).

Open points (honest): I am not a native speaker and no human proofreader has checked the 42 slides; abbreviations are expanded in terms.ts but not always at first use on the slide. A Translation and Interpreting teacher should do a final read.
