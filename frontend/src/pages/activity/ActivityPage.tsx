import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { transactionsApi } from '../../lib/api'
import { Transaction } from '../../types'
import { formatCurrency, formatRelativeTime, formatDate } from '../../lib/utils'
import { Wallet as WalletIcon, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

type FilterType = 'all' | 'confirmed' | 'pending'

export default function ActivityPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')

  useEffect(() => {
    fetchTransactions()
  }, [filter])

  const fetchTransactions = async () => {
    try {
      setIsLoading(true)
      const params: any = { limit: 50 }
      if (filter !== 'all') {
        params.status = filter.toUpperCase()
      }
      const response = await transactionsApi.list(params)
      setTransactions(response.data.data.transactions || [])
    } catch (error: any) {
      console.error('Failed to fetch transactions:', error)
      toast.error(
        error.response?.data?.error?.message || 'Failed to load transactions'
      )
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchTransactions()
  }

  // Group transactions by date
  const groupedTransactions = transactions.reduce((acc, tx) => {
    const date = new Date(tx.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateKey: string
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday'
    } else {
      dateKey = formatDate(tx.createdAt)
    }

    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(tx)
    return acc
  }, {} as Record<string, Transaction[]>)

  const getTransactionColor = (tx: Transaction) => {
    if (tx.type === 'SPLIT_PAYMENT' || tx.type === 'TRANSFER') {
      return 'text-success'
    }
    if (tx.type === 'CASH_OUT') {
      return 'text-error'
    }
    return 'text-text-primary'
  }

  const getTransactionLabel = (tx: Transaction) => {
    switch (tx.type) {
      case 'SPLIT_PAYMENT':
        return tx.from ? `Payment from ${tx.from.name}` : 'Split Payment'
      case 'ADD_FUNDS':
        return 'Added Funds'
      case 'CASH_OUT':
        return 'Cashed Out'
      case 'TRANSFER':
        return tx.from ? `Transfer from ${tx.from.name}` : 'Transfer'
      default:
        return 'Transaction'
    }
  }

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Activity</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'confirmed'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Confirmed
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
        </div>

        {/* Transaction List */}
        {isLoading ? (
          <Loading className="py-12" />
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <WalletIcon className="w-12 h-12 mx-auto text-text-secondary opacity-50 mb-3" />
              <p className="text-text-secondary">No transactions yet</p>
              <p className="text-sm text-text-secondary mt-1">
                {filter === 'all'
                  ? 'Your transaction history will appear here'
                  : `No ${filter} transactions`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedTransactions).map(([date, txs]) => (
              <div key={date}>
                {/* Date Header */}
                <h3 className="text-sm font-semibold text-text-secondary mb-3">
                  {date.toUpperCase()}
                </h3>

                {/* Transactions */}
                <div className="space-y-2">
                  {txs.map((tx) => (
                    <Card key={tx.id} variant="interactive">
                      <CardContent className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={tx.from?.avatar}
                            name={tx.from?.name || 'Transaction'}
                            size="md"
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
                            <p
                              className={`font-semibold text-sm ${getTransactionColor(
                                tx
                              )}`}
                            >
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
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
