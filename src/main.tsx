import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Apply saved theme synchronously before first render to prevent FOUC
const savedTheme = localStorage.getItem('grove_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
