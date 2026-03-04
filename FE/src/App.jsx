import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/public/Home'
import Cars from './pages/public/Cars'
import MyBookings from './pages/user/MyBookings'
import UserProfile from './pages/user/UserProfile'
import CarDetails from './pages/public/CarDetails'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import CarOwnerFleet from './pages/owner/CarOwnerFleet'
import OwnerVehicleDetails from './pages/owner/OwnerVehicleDetails'
import OwnerVehicleEdit from './pages/owner/OwnerVehicleEdit'
import OwnerPublicProfile from './pages/public/OwnerPublicProfile'
import OwnerRegistration from './pages/public/OwnerRegistration'
import ManageRentals from './pages/ManageRentals'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminVehicleRequestDetails from './pages/admin/AdminVehicleRequestDetails'
import AdminOwnerRegistrations from './pages/admin/AdminOwnerRegistrations'
import AdminOwnerRegistrationDetails from './pages/admin/AdminOwnerRegistrationDetails'
import { useAuth } from './hooks/useAuth'
import './styles/App.css'
import './index.css'

function hasAdminRole(user) {
  const scope = String(user?.role || user?.scope || '')
  return scope.includes('ROLE_ADMIN') || scope.includes('ADMIN')
}

function AdminRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasAdminRole(user)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppLayout() {
  const location = useLocation()
  const isOwnerArea = /^\/owner(\/|$)/.test(location.pathname)
  const isOwnerRentalsArea = /^\/manage-rentals(\/|$)/.test(location.pathname)
  const isAdminArea = /^\/admin(\/|$)/.test(location.pathname)
  const isOwnerDashboard = isOwnerArea || isOwnerRentalsArea || isAdminArea
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
          <Route path="/become-owner" element={<OwnerRegistration />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/manage-rentals" element={<ManageRentals />} />
          <Route path="/booking/:id/payment-success" element={<PaymentSuccess />} />
          <Route path="/booking/:id/payment-cancel" element={<PaymentCancel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/owner/fleet" element={<CarOwnerFleet />} />
          <Route path="/owner/fleet/vehicles" element={<CarOwnerFleet />} />
          <Route path="/owner/vehicles/:id" element={<OwnerVehicleDetails />} />
          <Route path="/owner/vehicles/:id/edit" element={<OwnerVehicleEdit />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vehicles" element={<AdminVehicles />} />
            <Route path="vehicles/:id" element={<AdminVehicleRequestDetails />} />
            <Route path="owner-registrations" element={<AdminOwnerRegistrations />} />
            <Route path="owner-registrations/:id" element={<AdminOwnerRegistrationDetails />} />
            <Route path="customers" element={<AdminCustomers />} />
          </Route>
        </Routes>
      </main>
      {!isOwnerDashboard && <Footer />}
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout />
          <Toaster richColors position="top-right" />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
