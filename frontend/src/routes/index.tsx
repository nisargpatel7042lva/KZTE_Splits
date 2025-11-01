import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '../components/ProtectedRoute'

// Auth pages
import WelcomePage from '../pages/auth/WelcomePage'
import LoginPage from '../pages/auth/LoginPage'
import VerifyOtpPage from '../pages/auth/VerifyOtpPage'
import SetupProfilePage from '../pages/auth/SetupProfilePage'

// Main pages
import HomePage from '../pages/home/HomePage'
import CreateSplitPage from '../pages/split/CreateSplitPage'
import SplitDetailPage from '../pages/split/SplitDetailPage'
import GroupsListPage from '../pages/groups/GroupsListPage'
import CreateGroupPage from '../pages/groups/CreateGroupPage'
import GroupDetailPage from '../pages/groups/GroupDetailPage'
import ActivityPage from '../pages/activity/ActivityPage'
import WalletPage from '../pages/wallet/WalletPage'
import ProfilePage from '../pages/profile/ProfilePage'

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
