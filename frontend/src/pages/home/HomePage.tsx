import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useWalletStore } from '../../store/walletStore'
import { Layout } from '../../components/layout/Layout'
import { Avatar } from '../../components/ui/Avatar'
import { Card, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Loading } from '../../components/ui/Loading'
import { formatCurrency, formatRelativeTime, truncateAddress } from '../../lib/utils'
import { Bell, Plus, Users, Camera, Send, Wallet as WalletIcon, Copy } from 'lucide-react'
import toast from 'react-hot-toast'
import { copyToClipboard } from '../../lib/utils'

export default function HomePage() {
  const { user } = useAuthStore()
  const { balance, summary, transactions, isLoading, fetchBalance, fetchSummary, fetchTransactions } = useWalletStore()

  useEffect(() => {
    fetchBalance()
    fetchSummary()
    fetchTransactions(10)
  }, [fetchBalance, fetchSummary, fetchTransactions])

  const handleCopyAddress = async () => {
    if (user?.walletAddress) {
      const success = await copyToClipboard(user.walletAddress)
      if (success) {
        toast.success('Address copied!')
      }
    }
  }

  const quickActions = [
    { icon: Plus, label: 'New Split', to: '/split/create', color: 'bg-primary' },
    { icon: Users, label: 'Create Group', to: '/groups/create', color: 'bg-secondary' },
    { icon: Camera, label: 'Scan Receipt', to: '/split/scan', color: 'bg-info' },
    { icon: Send, label: 'Send Money', to: '/wallet/send', color: 'bg-success' },
  ]

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <div className="bg-primary text-white px-6 pt-6 pb-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar src={user?.avatar} name={user?.name} size="md" />
              <div>
                <p className="text-sm opacity-90">Welcome back</p>
                <p className="font-semibold">{user?.name || 'User'}</p>
              </div>
            </div>
            <Link
              to="/notifications"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
            </Link>
          </div>

          {/* Balance Card */}
          <Card className="bg-white/10 backdrop-blur border-0">
            <CardContent className="text-center py-6">
              {isLoading ? (
                <Loading className="py-4" />
              ) : (
                <>
                  <p className="text-sm opacity-90 mb-2">KZTE Balance</p>
                  <p className="text-4xl font-bold mb-4">
                    {formatCurrency(balance)}
                  </p>
                  <div className="flex items-center justify-center gap-2 text-xs opacity-75">
                    <span>{truncateAddress(user?.walletAddress || '')}</span>
                    <button onClick={handleCopyAddress} className="p-1 hover:bg-white/10 rounded">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link to="/wallet/add-funds" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        Add Funds
                      </Button>
                    </Link>
                    <Link to="/wallet/cash-out" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20">
                        Cash Out
                      </Button>
                    </Link>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="px-6 -mt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card variant="elevated">
              <CardContent className="py-4">
                <p className="text-sm text-text-secondary mb-1">You Owe</p>
                <p className="text-xl font-bold text-error">
                  {summary ? formatCurrency(summary.youOwe.total) : '-'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {summary?.youOwe.count || 0} pending
                </p>
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardContent className="py-4">
                <p className="text-sm text-text-secondary mb-1">You're Owed</p>
                <p className="text-xl font-bold text-success">
                  {summary ? formatCurrency(summary.youAreOwed.total) : '-'}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  {summary?.youAreOwed.count || 0} pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
            <div className="grid grid-cols-4 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.label}
                    to={action.to}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className={`${action.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs text-center text-text-secondary font-medium">
                      {action.label}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <Link to="/activity" className="text-sm text-primary font-medium">
                See All
              </Link>
            </div>

            {isLoading ? (
              <Loading className="py-8" />
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <WalletIcon className="w-12 h-12 mx-auto text-text-secondary opacity-50 mb-3" />
                  <p className="text-text-secondary">No transactions yet</p>
                  <p className="text-sm text-text-secondary mt-1">
                    Start by creating your first split
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 5).map((tx) => (
                  <Card key={tx.id} variant="interactive">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={tx.from?.name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {tx.from?.name || 'Payment'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {formatRelativeTime(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === 'SPLIT_PAYMENT' ? 'text-success' : 'text-text-primary'}`}>
                            {formatCurrency(tx.amount)}
                          </p>
                          <p className="text-xs text-text-secondary capitalize">
                            {tx.status.toLowerCase()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
