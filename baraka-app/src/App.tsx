import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  )
}
