/** Single place to edit the dismissible welcome strip shown at the top of the site. */
export const WELCOME = {
  enabled: true,
  name: 'Ayşe',
  time: '05:00',
  storageKey: 'rota81-welcome-seen',
  tr: {
    message: (name: string, time: string) => `${name}, bu saatte sana yazmak istemedim. Şu an saat ${time} ve düzenledim. Rica etsem buradan sunumu inceleyebilir misin?`,
    open: 'Sunumu aç', close: 'Kapat', region: 'Karşılama notu',
  },
  en: {
    message: (name: string, time: string) => `${name}, I did not want to write to you at this hour. It is ${time} now and I have edited it. Could you please review the presentation from here?`,
    open: 'Open the presentation', close: 'Close', region: 'Welcome note',
  },
} as const
