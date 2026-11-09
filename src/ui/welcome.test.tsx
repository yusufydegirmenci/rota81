import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { WelcomeBanner } from './WelcomeBanner'

describe('WelcomeBanner TR|EN', () => {
  beforeEach(() => { localStorage.clear() })
  it('switches language and remembers it', () => {
    render(<MemoryRouter><WelcomeBanner /></MemoryRouter>)
    expect(screen.getByText(/bu saatte sana yazmak/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByText(/did not want to write/)).toBeTruthy()
    expect(localStorage.getItem('foradas-lang')).toBe('en')
    expect(screen.getByRole('link').textContent).toBe('Open the presentation')
  })
})
