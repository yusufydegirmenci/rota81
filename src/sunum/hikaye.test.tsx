import { describe, expect, it } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
const FILES = Object.keys(import.meta.glob('../../public/foto/*.jpg'))
import { FOTO } from './foto'
import Hikaye, { STORY_SAY, StoryPrint } from './Hikaye'

describe('story deck', () => {
  it('has 22 main slides, each with a spoken script of at most 5 short sentences', () => {
    expect(STORY_SAY.length).toBe(22)
    for (const s of STORY_SAY) expect((s.match(/[.?!](\s|$)/g) ?? []).length).toBeLessThanOrEqual(5)
  })
  it('print view renders every slide with a title and at most 3 bullet points', () => {
    const { container } = render(<StoryPrint />)
    const slides = container.querySelectorAll('.hk-slide')
    expect(slides.length).toBe(STORY_SAY.length)
    slides.forEach((s) => { expect(s.querySelector('h1, h2')).not.toBeNull(); expect(s.querySelectorAll('.hk-pts li').length).toBeLessThanOrEqual(3) })
  })
  it('opens on slide 2 from the URL and shows the controls', () => {
    const { getByRole, container } = render(<MemoryRouter initialEntries={['/sunum?s=2']}><Hikaye /></MemoryRouter>)
    expect(container.querySelector('h2')?.textContent).toMatch(/start again/i)
    expect(getByRole('toolbar')).toBeTruthy()
  })
  it('every Commons photo has author, licence, source page and a file', () => {
    for (const [id, f] of Object.entries(FOTO)) { expect(f.by && f.lic && f.src.startsWith('https://commons.wikimedia.org/')).toBeTruthy(); expect(FILES.some((f) => f.endsWith(`/${id}.jpg`))).toBe(true) }
  })
  it('the 10-minute path skips slide 3 (goes 2 to 4)', () => {
    const { container } = render(<MemoryRouter initialEntries={['/sunum?s=2&p=10']}><Hikaye /></MemoryRouter>)
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(container.querySelector('h2')?.textContent).toMatch(/one card were enough/i)
  })
})
