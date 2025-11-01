import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'

// Auth pages
import WelcomePage from '../pages/auth/WelcomePage'
import LoginPage from '../pages/auth/LoginPage'
import VerifyOtpPage from '../pages/auth/VerifyOtpPage'
import SetupProfilePage from '../pages/auth/SetupProfilePage'

// Main pages
import HomePage from '../pages/home/HomePage'

// Placeholder pages (to be implemented)
const CreateSplitPage = () => <div className="p-8">Create Split - Coming Soon</div>
const SplitDetailPage = () => <div className="p-8">Split Detail - Coming Soon</div>
const GroupsPage = () => <div className="p-8">Groups - Coming Soon</div>
const ActivityPage = () => <div className="p-8">Activity - Coming Soon</div>
const WalletPage = () => <div className="p-8">Wallet - Coming Soon</div>
const ProfilePage = () => <div className="p-8">Profile - Coming Soon</div>

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* Semi-protected (needs auth but not profile) */}
      <Route
        path="/setup-profile"
        element={
          <ProtectedRoute>
            <SetupProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/split/create"
        element={
          <ProtectedRoute>
            <CreateSplitPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/split/:id"
        element={
          <ProtectedRoute>
            <SplitDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/groups"
        element={
          <ProtectedRoute>
            <GroupsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <ActivityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}

export default AppRoutes
