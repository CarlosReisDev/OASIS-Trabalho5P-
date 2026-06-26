import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import './index.css'
import { App } from './App.tsx'
import { PerfilProvider } from '@/context/PerfilContext'
import { ConfirmProvider } from '@/components/ConfirmProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PerfilProvider>
      <ConfirmProvider>
        <BrowserRouter>
          <App />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </ConfirmProvider>
    </PerfilProvider>
  </StrictMode>,
)
