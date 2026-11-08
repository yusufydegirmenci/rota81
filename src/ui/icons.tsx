/** Çizgi simge seti (24px, 1.6 çizgi). Emoji yerine kullanılır; metin rengini devralır. */
const P: Record<string, string> = {
  home: 'M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5.5H9V20H5a1 1 0 0 1-1-1z',
  card: 'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM3 10h18M7 15h4',
  wallet: 'M4 7a2 2 0 0 1 2-2h11v3M4 7v10a2 2 0 0 0 2 2h13V8H6a2 2 0 0 1-2-1zM16 13.5h.01',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6',
  bag: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
  plus: 'M12 5v14M5 12h14',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  signal: 'M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0M12 12.01V12M12 12v7',
  bus: 'M5 16V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10M5 16h14v2a1 1 0 0 1-1 1h-1v1h-2v-1H9v1H7v-1H6a1 1 0 0 1-1-1zM5 11h14M8.5 14.5h.01M15.5 14.5h.01',
  pin: 'M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10zM12 12.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  bell: 'M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0',
  cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5a7 7 0 0 0-1.5-1.5L17 4l-3-1-1 2a7 7 0 0 0-2 0L10 3 7 4l.5 2A7 7 0 0 0 6 7.5L4 7l-1 3 2 1a7 7 0 0 0 0 2l-2 1 1 3 2-.5A7 7 0 0 0 7.5 18L7 20l3 1 1-2a7 7 0 0 0 2 0l1 2 3-1-.5-2a7 7 0 0 0 1.5-1.5l2 .5 1-3-2-1z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a6.5 6.5 0 0 1 3.5 6',
  lock: 'M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3',
  book: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10',
  help: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  building: 'M5 21V4h9v17M14 9h5v12M8 8h3M8 12h3M8 16h3M3 21h18',
  coin: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.5 9.2C14 8.5 13.2 8 12 8c-1.5 0-2.5.8-2.5 1.8 0 2.7 5 1.3 5 4 0 1-1 1.8-2.5 1.8-1.3 0-2.200-.5-2.700-1.300M12 6.5V8M12 16v1.500',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  megaphone: 'M4 10v4h3l8 4V6L7 10zM18 9a4 4 0 0 1 0 6',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  scroll: 'M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 0 3-3V6a2 2 0 0 0-2-2zM11 9h4M11 13h4',
  check: 'M5 12.500l4.500 4.500L19 7.500',
  shield: 'M12 3l8 3v6c0 4.500-3.300 7.800-8 9-4.700-1.200-8-4.500-8-9V6z',
  plug: 'M9 3v5M15 3v5M7 8h10v3a5 5 0 0 1-10 0zM12 16v5',
  key: 'M8 15a4 4 0 1 1 3.500-6H21v3h-2v2h-3v-2h-4.500A4 4 0 0 1 8 15z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  menu: 'M4 7h16M4 12h16M4 17h16',
  x: 'M6 6l12 12M18 6 6 18',
  star: 'M12 3.500l2.700 5.500 6 .9-4.400 4.200 1 6-5.300-2.800L6.700 20l1-6L3.300 9.900l6-.9z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.500 1.500M17.500 17.500 19 19M5 19l1.500-1.500M17.500 6.500 19 5',
  moon: 'M20 14.500A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z',
  walk: 'M13 5a1.500 1.500 0 1 0 0-3 1.500 1.500 0 0 0 0 3zM10 21l2-6-3-3 1-5 4 2 2 3 3 1M9 12l-2 3',
  tram: 'M7 4h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM5 11h14M8 21l2-3M16 21l-2-3M9 2l3 2 3-2',
  ferry: 'M3 17l2 3c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1l2-3-2-6H5zM9 11V6h6v5',
  tag: 'M3 12V4h8l10 10-8 8zM7.500 8h.01',
  down: 'M6 9l6 6 6-6',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
}

/** Eski emoji anahtarlarını simgeye eşler (menü tanımları emoji ile yazılmıştı). */
const EMOJI: Record<string, string> = {
  '🏠': 'home', '💳': 'card', '👛': 'wallet', '🧭': 'route', '🧳': 'bag', '➕': 'plus', '🧾': 'receipt', '🚏': 'pin', '⭐': 'star',
  '📡': 'signal', '🚌': 'bus', '📍': 'pin', '🗺️': 'map', '🔔': 'bell', '⚙️': 'cog', '👤': 'user', '🔒': 'lock', '📖': 'book', '❓': 'help',
  '📊': 'chart', '📈': 'trend', '🏢': 'building', '💰': 'coin', '🕒': 'clock', '📣': 'megaphone', '🗂️': 'folder', '📜': 'scroll',
  '🧑‍💼': 'user', '👥': 'users', '🔑': 'key', '✅': 'check', '🛡️': 'shield', '🔌': 'plug', '☰': 'menu',
}

export type IconName = keyof typeof P
export function Icon({ name, size = 20, className }: { name: string; size?: number; className?: string }) {
  const key = P[name] ? name : EMOJI[name] ?? 'pin'
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={P[key]} />
    </svg>
  )
}
