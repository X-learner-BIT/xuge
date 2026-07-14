import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { useAuthStore } from './store/authStore'

const state = useAuthStore.getState();
state.restore();

if (state.isDark) {
  document.body.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
