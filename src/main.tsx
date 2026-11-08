import { StrictMode } from 'react'
import { applyTheme, savedTheme } from './ui/ui'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

applyTheme(savedTheme())
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
