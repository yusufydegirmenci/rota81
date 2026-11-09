/** Transaction replay engine: pure data. One tap becomes an ordered trace of steps through the platform; faults change the trace. SIMULATION: no real payment. */
export type NodeId = 'reader' | 'gateway' | 'auth' | 'fare' | 'nosql' | 'sql' | 'queue' | 'notify' | 'storage'
export type Fault = 'none' | 'low-balance' | 'offline' | 'blacklist' | 'timeout'
export type Status = 'ok' | 'fail' | 'warn'
export interface TraceStep { active: NodeId[]; edge?: [NodeId, NodeId]; reverse?: boolean; status: Status; title: string; text: string; deep: string; ledgerCommit?: boolean; result?: 'ok' | 'bad' }

export const EDGES: [NodeId, NodeId][] = [['reader', 'gateway'], ['gateway', 'auth'], ['auth', 'fare'], ['fare', 'nosql'], ['fare', 'sql'], ['fare', 'queue'], ['queue', 'sql'], ['queue', 'notify'], ['queue', 'storage']]
export const FAULTS: { id: Fault; label: string; blurb: string }[] = [
  { id: 'none', label: 'Normal tap', blurb: 'Everything works: charged once, green light.' },
  { id: 'low-balance', label: 'Low balance', blurb: 'The fare engine finds too little balance; nothing is written to the ledger.' },
  { id: 'offline', label: 'Offline', blurb: 'The vehicle has no network; the reader uses its local rule set and syncs later.' },
  { id: 'blacklist', label: 'Blocked card', blurb: 'The card is on the deny list; the reader refuses before any network call.' },
  { id: 'timeout', label: 'Timeout', blurb: 'The fare engine is slow; the reader retries with the same key and the fare is charged once.' },
]

const S = (s: TraceStep) => s
const tap = S({ active: ['reader'], status: 'ok', title: 'Card tapped', text: 'The reader reads the card record and builds a signed request with a unique request id (idempotency key).', deep: 'The radio part is finished here. Everything that follows is software.' })

export function buildTrace(fault: Fault): TraceStep[] {
  const t: TraceStep[] = [tap]
  if (fault === 'blacklist') {
    t.push(S({ active: ['reader'], status: 'fail', result: 'bad', title: 'Deny list hit at the reader', text: 'The card id is on the local deny list the reader downloads regularly. The reader refuses at once: red light, no network call, no charge.', deep: 'Deny lists are cached on the device so a blocked card is refused even offline. The list is updated from the backend whenever the device is online.' }))
    return t
  }
  if (fault === 'offline') {
    t.push(S({ active: ['reader', 'gateway'], edge: ['reader', 'gateway'], status: 'fail', title: 'No network', text: 'The request cannot reach the gateway: the vehicle is in a coverage gap.', deep: 'The modem keeps trying in the background; the reader does not wait for it.' }))
    t.push(S({ active: ['reader'], status: 'warn', result: 'ok', title: 'Local rules decide', text: 'The reader applies its offline rule set (limits per card, deny list, tariff table) and accepts the tap. The request is stored in a local queue.', deep: 'Offline acceptance is a risk decision with limits (amount, count, age). It is better than blocking a passenger but must be reconciled afterwards.' }))
    t.push(S({ active: ['reader', 'gateway'], edge: ['reader', 'gateway'], status: 'ok', title: 'Back online: store and forward', text: 'Coverage returns. The queued request is sent with its original request id and time.', deep: 'Store-and-forward keeps the original timestamp so the fare engine applies the tariff that was valid at the tap.' }))
  } else {
    t.push(S({ active: ['reader', 'gateway'], edge: ['reader', 'gateway'], status: 'ok', title: 'Request reaches the gateway', text: 'The gateway terminates TLS, checks the device certificate and rate-limits the caller.', deep: 'Gateway = the single front door; it protects every service behind it.' }))
  }
  t.push(S({ active: ['gateway', 'auth'], edge: ['gateway', 'auth'], status: 'ok', title: 'Authentication', text: 'The auth service verifies the device and the card signature. It does not decide the price.', deep: 'Authentication answers "who is asking?"; authorisation and fare answer "may they, and how much?".' }))
  t.push(S({ active: ['auth', 'fare'], edge: ['auth', 'fare'], status: 'ok', title: 'Fare engine receives it', text: 'The microservice that owns tariffs takes the request.', deep: 'Each service owns one responsibility and its own data.' }))
  if (fault === 'timeout') {
    t.push(S({ active: ['auth', 'fare'], edge: ['auth', 'fare'], status: 'fail', title: 'No answer in time', text: 'The fare engine is slow. The reader waits 800 ms and gets no answer: timeout.', deep: 'A timeout does not mean the charge failed. It means "unknown", which is why retries must be safe.' }))
    t.push(S({ active: ['reader', 'gateway', 'auth', 'fare'], status: 'warn', title: 'Retry with the same key', text: 'The reader retries with the same request id. The fare engine recognises the key and will process it exactly once.', deep: 'Idempotency: same key, same result. A duplicate request returns the stored answer instead of charging again.' }))
  }
  t.push(S({ active: ['fare', 'nosql'], edge: ['fare', 'nosql'], status: 'ok', title: 'Trip history', text: 'The engine reads the recent trips of this card to see whether a transfer discount applies.', deep: 'Trip history is read-heavy and flexible in shape, so a document store suits it.' }))
  if (fault === 'low-balance') {
    t.push(S({ active: ['fare', 'sql'], edge: ['fare', 'sql'], status: 'fail', result: 'bad', title: 'Balance too low', text: 'The account database shows less than the fare. The engine declines: no ledger entry is written and nothing is charged.', deep: 'The decline travels back to the reader (red) and to the app (top-up hint). Declines are logged but do not change balances.' }))
    t.push(S({ active: ['fare', 'queue', 'notify'], edge: ['queue', 'notify'], status: 'warn', title: 'Passenger is told', text: 'A notification suggests topping up the balance.', deep: 'Notifications are asynchronous: the tap result never waits for them.' }))
    return t
  }
  t.push(S({ active: ['fare', 'sql'], edge: ['fare', 'sql'], status: 'ok', ledgerCommit: true, title: 'Balance check and ledger entry', text: 'Enough balance: the fare is written to the ledger in one transaction with the balance change (SIMULATION: no real money).', deep: 'Double-entry bookkeeping: every movement has two sides, so the ledger always adds up.' }))
  t.push(S({ active: ['fare', 'queue'], edge: ['fare', 'queue'], status: 'ok', title: 'Event published', text: 'A "fare charged" event goes onto the message queue for everything that must happen next.', deep: 'The queue decouples the fast tap path from slower work: receipts, archiving, reporting, settlement files.' }))
  t.push(S({ active: ['queue', 'notify', 'storage'], edge: ['queue', 'storage'], status: 'ok', title: 'Receipt and audit copy', text: 'The notification service sends a receipt; the audit copy goes to cloud storage.', deep: 'Audit storage is append-only so history cannot be rewritten.' }))
  t.push(S({ active: ['gateway', 'reader'], edge: ['reader', 'gateway'], reverse: true, status: 'ok', result: 'ok', title: 'Answer returns', text: 'The answer travels back: green light and a short beep on the reader.', deep: 'The tap is complete in well under a second; the queue work continues without the passenger waiting.' }))
  return t
}
