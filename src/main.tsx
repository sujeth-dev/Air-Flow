import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import App from './App.tsx'

const root = document.getElementById('app-root')
if (!root) throw new Error('Root element #app-root not found')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// Register the service worker for offline shell + asset caching.
// We register after window load so it doesn't compete with first paint.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('SW registration failed:', err)
    })
  })
}
