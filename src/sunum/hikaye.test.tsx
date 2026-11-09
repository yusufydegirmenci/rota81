import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Hikaye, { STORY_SAY, StoryPrint } from './Hikaye'

describe('story deck', () => {
  it('has 12-15 main slides, each with a spoken script of at most 5 short sentences', () => {
    expect(STORY_SAY.length).toBeGreaterThanOrEqual(12)
    expect(STORY_SAY.length).toBeLessThanOrEqual(15)
    for (const s of STORY_SAY) expect((s.match(/[.?!](\s|$)/g) ?? []).length).toBeLessThanOrEqual(5)
  })
  it('print view renders every slide with a title and at most 3 bullet points', () => {
    const { container } = render(<StoryPrint />)
    const slides = container.querySelectorAll('.hk-slide')
    expect(slides.length).toBe(STORY_SAY.length)
    slides.forEach((s) => { expect(s.querySelector('h1, h2')).not.toBeNull(); expect(s.querySelectorAll('.hk-pts li').length).toBeLessThanOrEqual(3) })
  })
  it('opens on slide 3 from the URL and shows the controls', () => {
    const { getByRole, container } = render(<MemoryRouter initialEntries={['/sunum?s=3']}><Hikaye /></MemoryRouter>)
    expect(container.querySelector('h2')?.textContent).toMatch(/ticket/i)
    expect(getByRole('toolbar')).toBeTruthy()
  })
})
