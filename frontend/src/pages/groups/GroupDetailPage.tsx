import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { groupsApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Group } from '../../types'
import { formatCurrency, formatRelativeTime } from '../../lib/utils'
import { ArrowLeft, Plus, Users, Settings, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [group, setGroup] = useState<Group | null>(null)
  const [balances, setBalances] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSettling, setIsSettling] = useState(false)

  useEffect(() => {
    if (id) {
      fetchGroupDetails()
      fetchBalances()
    }
  }, [id])

  const fetchGroupDetails = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const response = await groupsApi.getById(id)
      setGroup(response.data.data.group)
    } catch (error: any) {
      console.error('Failed to fetch group:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBalances = async () => {
    if (!id) return

    try {
      const response = await groupsApi.getBalances(id)
      setBalances(response.data.data)
    } catch (error: any) {
      console.error('Failed to fetch balances:', error)
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Loading className="py-12" />
      </Layout>
    )
  }

  if (!group) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-text-secondary">Group not found</p>
          <Button onClick={() => navigate('/groups')} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </Layout>
    )
  }

  const isAdmin = group.role === 'ADMIN'
  const myBalance = balances?.balances?.find((b: any) => b.userId === user?.id)

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/groups')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            <p className="text-sm text-text-secondary">
              {group.memberCount} members
            </p>
          </div>
          {isAdmin && (
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5 text-text-secondary" />
            </button>
          )}
        </div>

        {/* Group Avatar & Info */}
        <Card variant="elevated" className="mb-6">
          <CardContent className="py-6 text-center">
            <Avatar
              src={group.avatar}
              name={group.name}
              size="xl"
              className="mx-auto mb-4"
            />
            <div className="flex items-center justify-center gap-4 text-sm">
              <div>
                <p className="text-text-secondary">Your Balance</p>
                {myBalance && (
                  <p className={`text-lg font-bold ${
                    myBalance.netBalance > 0
                      ? 'text-success'
                      : myBalance.netBalance < 0
                      ? 'text-error'
                      : 'text-text-primary'
                  }`}>
                    {myBalance.netBalance > 0 ? '+' : ''}
                    {formatCurrency(myBalance.netBalance)}
                  </p>
                )}
                {!myBalance && (
                  <p className="text-lg font-bold text-text-primary">
                    {formatCurrency(0)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to={`/split/create?group=${id}`}>
            <Button variant="secondary" size="lg" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
            </Button>
          </Link>
          {balances?.simplifiedTransactions?.length > 0 && (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                // Settle group functionality
                toast.info('Settle feature coming soon')
              }}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Settle Up
            </Button>
          )}
        </div>

        {/* Simplified Balances */}
        {balances?.simplifiedTransactions?.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">
              SETTLE BALANCES
            </h3>
            <Card>
              <CardContent className="py-2">
                <div className="space-y-3">
                  {balances.simplifiedTransactions.map((tx: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 py-2">
                      <Avatar
                        src={tx.from.avatar}
                        name={tx.from.name}
                        size="sm"
                      />
                      <div className="flex-1 text-sm">
                        <span className="font-medium">{tx.from.name}</span>
                        <span className="text-text-secondary"> pays </span>
                        <span className="font-medium">{tx.to.name}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Members */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-secondary">
              MEMBERS ({group.members?.length || 0})
            </h3>
            {isAdmin && (
              <button className="text-sm text-primary font-medium">
                Add Member
              </button>
            )}
          </div>
          <Card>
            <CardContent className="py-2">
              <div className="space-y-2">
                {group.members?.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 py-2"
                  >
                    <Avatar
                      src={member.avatar}
                      name={member.name}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="font-medium">
                        {member.name}
                        {member.userId === user?.id && (
                          <span className="text-primary ml-1">(You)</span>
                        )}
                      </p>
                      {member.role === 'ADMIN' && (
                        <Badge variant="default" className="mt-1">
                          Admin
                        </Badge>
                      )}
                    </div>
                    {balances?.balances?.find((b: any) => b.userId === member.userId) && (
                      <span
                        className={`text-sm font-medium ${
                          balances.balances.find((b: any) => b.userId === member.userId)
                            .netBalance > 0
                            ? 'text-success'
                            : balances.balances.find((b: any) => b.userId === member.userId)
                                .netBalance < 0
                            ? 'text-error'
                            : 'text-text-secondary'
                        }`}
                      >
                        {formatCurrency(
                          Math.abs(
                            balances.balances.find((b: any) => b.userId === member.userId)
                              .netBalance
                          )
                        )}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Splits */}
        {group.recentSplits && group.recentSplits.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text-secondary">
                RECENT SPLITS
              </h3>
              <Link to={`/activity?group=${id}`} className="text-sm text-primary font-medium">
                See All
              </Link>
            </div>
            <div className="space-y-2">
              {group.recentSplits.map((split) => (
                <Link key={split.id} to={`/split/${split.id}`}>
                  <Card variant="interactive">
                    <CardContent className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={split.paidBy.avatar}
                          name={split.paidBy.name}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {split.description || 'Split'}
                          </p>
                          <p className="text-xs text-text-secondary">
                            {split.paidBy.name} paid{' '}
                            {formatRelativeTime(split.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(split.amount)}
                          </p>
                          <Badge
                            variant={
                              split.status === 'COMPLETED'
                                ? 'success'
                                : split.status === 'PENDING'
                                ? 'warning'
                                : 'default'
                            }
                            className="mt-1"
                          >
                            {split.status.toLowerCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!group.recentSplits || group.recentSplits.length === 0) && (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-text-secondary opacity-50 mx-auto mb-3" />
              <p className="text-text-secondary">No expenses yet</p>
              <p className="text-sm text-text-secondary mt-1">
                Add your first group expense
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
