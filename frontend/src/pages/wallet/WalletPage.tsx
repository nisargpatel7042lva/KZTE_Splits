import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { useWalletStore } from '../../store/walletStore'
import { useAuthStore } from '../../store/authStore'
import { transactionsApi } from '../../lib/api'
import { Transaction } from '../../types'
import { formatCurrency, formatRelativeTime, truncateAddress, copyToClipboard } from '../../lib/utils'
import { QrCode, Copy, Plus, ArrowUpRight, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function WalletPage() {
  const { balance, fetchBalance, isLoading: isLoadingBalance } = useWalletStore()
  const { user } = useAuthStore()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [showQRModal, setShowQRModal] = useState(false)

  useEffect(() => {
    fetchBalance()
    fetchRecentTransactions()
  }, [])

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const response = await transactionsApi.getRecent(10)
      setTransactions(response.data.data.transactions || [])
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const handleCopyAddress = async () => {
    if (user?.walletAddress) {
      const success = await copyToClipboard(user.walletAddress)
      if (success) {
        toast.success('Address copied!')
      }
    }
  }

  const getTransactionLabel = (tx: Transaction) => {
    switch (tx.type) {
      case 'SPLIT_PAYMENT':
        return tx.from ? `From ${tx.from.name}` : 'Split Payment'
      case 'ADD_FUNDS':
        return 'Added Funds'
      case 'CASH_OUT':
        return 'Cashed Out'
      case 'TRANSFER':
        return tx.from ? `From ${tx.from.name}` : 'Transfer'
      default:
        return 'Transaction'
    }
  }

  const getTransactionColor = (tx: Transaction) => {
    if (tx.type === 'SPLIT_PAYMENT' || tx.type === 'TRANSFER' || tx.type === 'ADD_FUNDS') {
      return 'text-success'
    }
    if (tx.type === 'CASH_OUT') {
      return 'text-error'
    }
    return 'text-text-primary'
  }

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <h1 className="text-2xl font-bold mb-6">Wallet</h1>

        {/* Balance Card */}
        <Card variant="elevated" className="mb-6">
          <CardContent className="py-8 text-center">
            {isLoadingBalance ? (
              <Loading className="py-4" />
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-2">KZTE Balance</p>
                <p className="text-6xl font-bold text-primary mb-6">
                  {formatCurrency(balance)}
                </p>

                {/* Wallet Address */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-text-secondary mb-2">
                    Your Wallet Address
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="font-mono text-sm text-text-primary break-all">
                      {user?.walletAddress ? truncateAddress(user.walletAddress, 6) : '-'}
                    </p>
                    <button
                      onClick={handleCopyAddress}
                      className="p-1.5 hover:bg-white rounded transition-colors"
                    >
                      <Copy className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </div>

                {/* QR Code Button */}
                <button
                  onClick={() => setShowQRModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-primary font-medium hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  Show QR Code
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button size="lg" onClick={() => toast.info('Add funds feature coming soon')}>
            <Plus className="w-4 h-4 mr-2" />
            Add Funds
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => toast.info('Cash out feature coming soon')}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            Cash Out
          </Button>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-text-primary">Recent Transactions</h3>
            <Link to="/activity" className="text-sm text-primary font-medium">
              See All
            </Link>
          </div>

          {isLoadingTransactions ? (
            <Loading className="py-8" />
          ) : transactions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-text-secondary">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <Card key={tx.id} variant="interactive">
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={tx.from?.avatar}
                        name={tx.from?.name || 'Transaction'}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {getTransactionLabel(tx)}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {formatRelativeTime(tx.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${getTransactionColor(tx)}`}>
                          {tx.type === 'CASH_OUT' ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </p>
                        <Badge
                          variant={
                            tx.status === 'CONFIRMED'
                              ? 'success'
                              : tx.status === 'PENDING'
                              ? 'warning'
                              : 'default'
                          }
                          className="mt-1"
                        >
                          {tx.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Receive KZTE</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* QR Code Placeholder - In production, use a QR library like 'qrcode.react' */}
              <div className="bg-gray-50 p-8 rounded-xl text-center mb-4">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-gray-200">
                  <QrCode className="w-32 h-32 text-gray-400" />
                </div>
                <p className="text-xs text-text-secondary mt-4">
                  QR code generation coming soon
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-text-secondary mb-1">
                  Your Wallet Address
                </p>
                <p className="font-mono text-xs break-all text-text-primary">
                  {user?.walletAddress}
                </p>
              </div>

              <Button
                onClick={handleCopyAddress}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Layout>
  )
}
