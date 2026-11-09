// Usage: npm run build && npx vite preview --port 4173 &  then: npm run export:pdf  (needs `npx playwright install chromium`)
import { chromium } from 'playwright'
const url = process.env.DECK_URL || 'http://127.0.0.1:4173/#/sunum/pdf'
const out = process.env.DECK_OUT || 'public/rota81-sunum.pdf'
const b = await chromium.launch(); const p = await b.newPage()
await p.goto(url, { waitUntil: 'networkidle' })
await p.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' } })
await b.close(); console.log('wrote', out)
