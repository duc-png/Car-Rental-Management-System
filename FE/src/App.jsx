import { useEffect, useLayoutEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import Home from './pages/public/Home'
import Cars from './pages/public/Cars'
import MyBookings from './pages/user/MyBookings'
import MyIncidentReports from './pages/user/MyIncidentReports'
import CustomerProfile from './pages/user/CustomerProfile'
import ChatPage from './pages/user/ChatPage'
import CarDetails from './pages/public/CarDetails'
import Login from './pages/auth/Login'
import OwnerLogin from './pages/auth/OwnerLogin'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import OAuth2Callback from './pages/auth/OAuth2Callback'
import CarOwnerFleet from './pages/owner/CarOwnerFleet'
import OwnerVehicleDetails from './pages/owner/OwnerVehicleDetails'
import OwnerVehicleEdit from './pages/owner/OwnerVehicleEdit'
import OwnerResponseDashboard from './pages/owner/OwnerResponseDashboard'
import OwnerBookingCalendar from './pages/owner/OwnerBookingCalendar'
import OwnerWallet from './pages/owner/OwnerWallet'
import OwnerPublicProfile from './pages/public/OwnerPublicProfile'
import OwnerRegistration from './pages/public/OwnerRegistration'
import ManageRentals from './pages/ManageRentals'
import PaymentSuccess from './pages/PaymentSuccess'
import PaymentCancel from './pages/PaymentCancel'
import AdminLayout from './pages/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminOwners from './pages/admin/AdminOwners'
import AdminVehicles from './pages/admin/AdminVehicles'
import AdminVehicleRequestDetails from './pages/admin/AdminVehicleRequestDetails'
import AdminOwnerRegistrations from './pages/admin/AdminOwnerRegistrations'
import AdminOwnerRegistrationDetails from './pages/admin/AdminOwnerRegistrationDetails'
import AdminCustomerLicenseReview from './pages/admin/AdminCustomerLicenseReview'
import AdminIncidentReports from './pages/admin/AdminIncidentReports'
import MaintenanceDashboard from './pages/MaintenanceDashboard'
import Customers from './pages/Customers'
import OwnerAnalytics from './pages/OwnerAnalytics'
import AdminReports from './pages/AdminReports'
import OwnerIncidentReports from './pages/owner/OwnerIncidentReports'
import CustomerChatWidget from './components/chat/CustomerChatWidget'
import { useAuth } from './hooks/useAuth'
import { getDashboardPathByRole } from './utils/authUser'
import './styles/App.css'
import './index.css'

const forceScrollTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

function hasAdminRole(user) {
  const scope = String(user?.role || user?.scope || '')
  return scope.includes('ROLE_ADMIN') || scope.includes('ADMIN')
}

function hasOwnerRole(user) {
  const scope = String(user?.role || user?.scope || '')
  return scope.includes('ROLE_CAR_OWNER') || scope.includes('ROLE_EXPERT') || scope.includes('CAR_OWNER') || scope.includes('EXPERT')
}

function OwnerRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()

  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasOwnerRole(user)) {
    return <Navigate to="/" replace />
  }

  return children
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
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useLayoutEffect(() => {
    forceScrollTop()
    const rafId = window.requestAnimationFrame(() => {
      forceScrollTop()
    })
    const timeoutId = window.setTimeout(() => {
      forceScrollTop()
    }, 0)

    return () => {
      window.cancelAnimationFrame(rafId)
      window.clearTimeout(timeoutId)
    }
  }, [location.pathname, location.search, location.hash])

  const isOwnerArea = /^\/owner(\/|$)/.test(location.pathname)
  const isOwnerRentalsArea = /^\/manage-rentals(\/|$)/.test(location.pathname)
  const isAdminArea = /^\/admin(\/|$)/.test(location.pathname)
  const isChatPage = /^\/chat(\/|$)/.test(location.pathname)
  const isOwnerDashboard = isOwnerArea || isOwnerRentalsArea || isAdminArea
  const isCarDetailsPage = location.pathname.startsWith('/car/') || (location.pathname.startsWith('/cars/') && location.pathname !== '/cars')
  const isAuthPage = /^\/(login|register|owner\/login|forgot-password|oauth2\/callback)(\/|$)/.test(location.pathname)
  const dashboardPath = getDashboardPathByRole(user)
  const isCustomerAccount = isAuthenticated && dashboardPath === '/my-bookings'
  const shouldShowCustomerChatWidget = isCustomerAccount && !isOwnerDashboard && !isChatPage && !isAuthPage

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
          <Route path="/my-reports" element={<MyIncidentReports />} />
          <Route path="/profile" element={<CustomerProfile />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/manage-rentals" element={<OwnerRoute><ManageRentals /></OwnerRoute>} />
          <Route path="/booking/:id/payment-success" element={<PaymentSuccess />} />
          <Route path="/booking/:id/payment-cancel" element={<PaymentCancel />} />
          <Route path="/login" element={<Login />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/oauth2/callback" element={<OAuth2Callback />} />
          <Route path="/owner/fleet" element={<OwnerRoute><CarOwnerFleet /></OwnerRoute>} />
          <Route path="/owner/fleet/vehicles" element={<OwnerRoute><CarOwnerFleet /></OwnerRoute>} />
          <Route path="/owner/vehicles/:id" element={<OwnerRoute><OwnerVehicleDetails /></OwnerRoute>} />
          <Route path="/owner/vehicles/:id/edit" element={<OwnerRoute><OwnerVehicleEdit /></OwnerRoute>} />
          <Route path="/owner/feedback" element={<OwnerRoute><OwnerResponseDashboard /></OwnerRoute>} />
          <Route path="/owner/booking-calendar" element={<OwnerRoute><OwnerBookingCalendar /></OwnerRoute>} />
          <Route path="/owner/wallet" element={<OwnerRoute><OwnerWallet /></OwnerRoute>} />
          <Route path="/owner/maintenance" element={<OwnerRoute><MaintenanceDashboard /></OwnerRoute>} />
          <Route path="/owner/analytics" element={<OwnerRoute><OwnerAnalytics /></OwnerRoute>} />
          <Route path="/owner/incident-reports" element={<OwnerRoute><OwnerIncidentReports /></OwnerRoute>} />
          <Route path="/customers" element={<OwnerRoute><Customers /></OwnerRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="vehicles" element={<AdminVehicles />} />
            <Route path="vehicles/:id" element={<AdminVehicleRequestDetails />} />
            <Route path="owner-registrations" element={<AdminOwnerRegistrations />} />
            <Route path="owner-registrations/:id" element={<AdminOwnerRegistrationDetails />} />
            <Route path="owners" element={<AdminOwners />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="customers/:id/license-review" element={<AdminCustomerLicenseReview />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="incident-reports" element={<AdminIncidentReports />} />
          </Route>
        </Routes>
      </main>
      {!isOwnerDashboard && !isChatPage && <Footer />}
      {shouldShowCustomerChatWidget && <CustomerChatWidget />}
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

