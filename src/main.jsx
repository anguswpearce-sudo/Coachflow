import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import PublicCoachProfile from './pages/PublicCoachProfile.jsx'
import PublicStudentProfile from './pages/PublicStudentProfile.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/coach/:id" element={<PublicCoachProfile />} />
        <Route path="/student/:id" element={<PublicStudentProfile />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)