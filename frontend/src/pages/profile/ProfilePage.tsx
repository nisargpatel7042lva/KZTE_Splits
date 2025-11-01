import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card, CardContent } from '../../components/ui/Card'
import { useAuthStore } from '../../store/authStore'
import { formatPhoneNumber } from '../../lib/utils'
import { Edit2, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Info } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/welcome')
    toast.success('Logged out successfully')
  }

  const menuItems = [
    {
      icon: CreditCard,
      label: 'Bank Accounts',
      subtitle: 'Manage linked accounts',
      onClick: () => toast.info('Bank accounts feature coming soon'),
    },
    {
      icon: Bell,
      label: 'Notifications',
      subtitle: 'Manage notifications',
      onClick: () => toast.info('Notification settings coming soon'),
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      subtitle: 'Get help or contact us',
      onClick: () => toast.info('Help center coming soon'),
    },
    {
      icon: Info,
      label: 'About',
      subtitle: 'Version 1.0.0',
      onClick: () => toast.info('KZTE Splits v1.0.0'),
    },
  ]

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        {/* Profile Card */}
        <Card variant="elevated" className="mb-6">
          <CardContent className="py-6">
            <div className="flex flex-col items-center text-center">
              <Avatar
                src={user?.avatar}
                name={user?.name}
                size="xl"
                className="mb-4"
              />
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                {user?.name || 'User'}
              </h2>
              <p className="text-text-secondary mb-4">
                {user?.phone ? formatPhoneNumber(user.phone) : ''}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Edit profile feature coming soon')}
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2 mb-6">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={index}
                onClick={item.onClick}
                className="w-full"
              >
                <Card variant="interactive">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-text-primary">
                          {item.label}
                        </p>
                        <p className="text-sm text-text-secondary truncate">
                          {item.subtitle}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>

        {/* Logout Button */}
        <Button
          variant="danger"
          size="lg"
          className="w-full"
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        {/* App Info */}
        <div className="mt-8 text-center text-sm text-text-secondary">
          <p>KZTE Splits</p>
          <p className="mt-1">Version 1.0.0</p>
          <p className="mt-2">Made with Claude Code</p>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-2">Logout</h3>
              <p className="text-text-secondary mb-6">
                Are you sure you want to logout?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}
