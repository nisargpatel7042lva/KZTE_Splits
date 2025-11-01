import { Routes, Route, Navigate } from 'react-router-dom'

// Placeholder pages - will be implemented
const WelcomePage = () => <div className="p-8">Welcome Page - Coming Soon</div>
const LoginPage = () => <div className="p-8">Login Page - Coming Soon</div>
const VerifyOtpPage = () => <div className="p-8">Verify OTP - Coming Soon</div>
const SetupProfilePage = () => <div className="p-8">Setup Profile - Coming Soon</div>
const HomePage = () => <div className="p-8">Home Dashboard - Coming Soon</div>
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
      <Route path="/setup-profile" element={<SetupProfilePage />} />

      {/* Protected routes */}
      <Route path="/home" element={<HomePage />} />
      <Route path="/split/create" element={<CreateSplitPage />} />
      <Route path="/split/:id" element={<SplitDetailPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/activity" element={<ActivityPage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/profile" element={<ProfilePage />} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/welcome" replace />} />
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  )
}

export default AppRoutes
