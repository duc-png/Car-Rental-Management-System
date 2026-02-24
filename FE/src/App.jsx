import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/public/Home'
import Cars from './pages/public/Cars'
import MyBookings from './pages/user/MyBookings'
import CarDetails from './pages/public/CarDetails'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import CarOwnerFleet from './pages/owner/CarOwnerFleet'
import OwnerPublicProfile from './pages/public/OwnerPublicProfile'
import './styles/App.css'
import './index.css'

function AppLayout() {
  const location = useLocation()
  const isOwnerDashboard = location.pathname === '/owner' || location.pathname.startsWith('/owner/')
  const isCarDetailsPage = location.pathname.startsWith('/car/') || (location.pathname.startsWith('/cars/') && location.pathname !== '/cars')

  return (
    <>
      {!isOwnerDashboard && <Navbar sticky={!isCarDetailsPage} />}
      <main className={isOwnerDashboard ? 'owner-main' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/car/:id" element={<CarDetails />} />
          <Route path="/cars/:id" element={<CarDetails />} />
          <Route path="/owners/:ownerId" element={<OwnerPublicProfile />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/owner/fleet" element={<CarOwnerFleet />} />
        </Routes>
      </main>
      {!isOwnerDashboard && <Footer />}
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppLayout />
      </Router>
    </ThemeProvider>
  )
}

export default App
