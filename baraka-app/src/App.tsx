import { BrowserRouter, HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Explore from './pages/Explore'
import BasketDetail from './pages/BasketDetail'
import MyReservations from './pages/MyReservations'
import MerchantDashboard from './pages/merchant/MerchantDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'

// Preview builds (e.g. embedded as a static artifact, without a server that
// rewrites deep links to index.html) use hash-based routing instead.
const Router = import.meta.env.VITE_ROUTER_MODE === 'hash' ? HashRouter : BrowserRouter

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Landing />} />
            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route path="explore" element={<Explore />} />
            <Route path="basket/:id" element={<BasketDetail />} />
            <Route
              path="reservations"
              element={
                <ProtectedRoute role="client">
                  <MyReservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="merchant"
              element={
                <ProtectedRoute role="merchant">
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}
