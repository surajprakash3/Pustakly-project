import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { MarketplaceProvider } from './context/MarketplaceContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MarketplaceProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </MarketplaceProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
