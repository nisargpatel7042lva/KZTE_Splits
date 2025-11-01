import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/layout/Layout'
import { Button } from '../../components/ui/Button'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Card, CardContent } from '../../components/ui/Card'
import { Loading } from '../../components/ui/Loading'
import { splitsApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { Split } from '../../types'
import { formatCurrency, formatRelativeTime, formatDate, truncateAddress } from '../../lib/utils'
import { ArrowLeft, Check, Clock, ExternalLink, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SplitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [split, setSplit] = useState<Split | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)

  useEffect(() => {
    if (id) {
      fetchSplit()
    }
  }, [id])

  const fetchSplit = async () => {
    if (!id) return

    try {
      setIsLoading(true)
      const response = await splitsApi.getById(id)
      setSplit(response.data.data.split)
    } catch (error: any) {
      console.error('Failed to fetch split:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to load split')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePay = async () => {
    if (!id || isPaying) return

    try {
      setIsPaying(true)
      await splitsApi.pay(id)
      toast.success('Payment successful!')
      // Refresh split data
      await fetchSplit()
    } catch (error: any) {
      console.error('Failed to pay split:', error)
      toast.error(error.response?.data?.error?.message || 'Payment failed')
    } finally {
      setIsPaying(false)
    }
  }

  const handleCancel = async () => {
    if (!id || !split) return

    if (!window.confirm('Cancel this split? This cannot be undone.')) {
      return
    }

    try {
      await splitsApi.cancel(id)
      toast.success('Split cancelled')
      navigate('/home')
    } catch (error: any) {
      console.error('Failed to cancel split:', error)
      toast.error(error.response?.data?.error?.message || 'Failed to cancel split')
    }
  }

  if (isLoading) {
    return (
      <Layout>
        <Loading className="py-12" />
      </Layout>
    )
  }

  if (!split) {
    return (
      <Layout>
        <div className="p-8 text-center">
          <p className="text-text-secondary">Split not found</p>
          <Button onClick={() => navigate('/home')} className="mt-4">
            Go Home
          </Button>
        </div>
      </Layout>
    )
  }

  const myParticipation = split.participants.find(p => p.userId === user?.id)
  const isPayer = split.paidBy.id === user?.id
  const canPay = myParticipation && !myParticipation.paid && !isPayer
  const canCancel = isPayer && split.status === 'PENDING' && !split.participants.some(p => p.paid)

  const statusColor = {
    PENDING: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'default',
  }

  return (
    <Layout>
      <div className="pb-6">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4 -mx-6 -mt-6 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 font-semibold text-lg">Split Details</h1>
          <Badge variant={statusColor[split.status] as any}>
            {split.status.toLowerCase()}
          </Badge>
        </div>

        {/* Amount Card */}
        <Card variant="elevated" className="mb-6">
          <CardContent className="text-center py-6">
            <p className="text-sm text-text-secondary mb-2">Total Amount</p>
            <p className="text-5xl font-bold text-primary mb-2">
              {formatCurrency(split.amount)}
            </p>
            {split.description && (
              <p className="text-text-primary mt-2">{split.description}</p>
            )}
            <p className="text-xs text-text-secondary mt-2">
              {formatDate(split.createdAt)}
              {' • '}
              {formatRelativeTime(split.createdAt)}
            </p>
            {split.splitType && (
              <p className="text-xs text-text-secondary mt-1">
                Split type: {split.splitType.toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payer Info */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">PAID BY</h3>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={split.paidBy.avatar}
                  name={split.paidBy.name}
                  size="md"
                />
                <div className="flex-1">
                  <p className="font-medium">
                    {split.paidBy.name}
                    {isPayer && <span className="text-primary ml-1">(You)</span>}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {formatCurrency(split.amount)}
                  </p>
                </div>
                <Check className="w-5 h-5 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Participants */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">
            PARTICIPANTS ({split.participants.length})
          </h3>
          <div className="space-y-2">
            {split.participants.map((participant) => {
              const isMe = participant.userId === user?.id
              return (
                <Card key={participant.userId}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={participant.avatar}
                        name={participant.name}
                        size="md"
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {participant.name}
                          {isMe && <span className="text-primary ml-1">(You)</span>}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {formatCurrency(participant.amount)}
                        </p>
                        {participant.paid && participant.paidAt && (
                          <p className="text-xs text-success">
                            Paid {formatRelativeTime(participant.paidAt)}
                          </p>
                        )}
                      </div>
                      {participant.paid ? (
                        <div className="flex flex-col items-end">
                          <Check className="w-5 h-5 text-success" />
                          {participant.txHash && (
                            <a
                              href={`https://solscan.io/tx/${participant.txHash}?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary flex items-center gap-1 mt-1"
                            >
                              View TX
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <Clock className="w-5 h-5 text-warning" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Group Info */}
        {split.group && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">GROUP</h3>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={split.group.avatar}
                    name={split.group.name}
                    size="md"
                  />
                  <div>
                    <p className="font-medium">{split.group.name}</p>
                    <p className="text-sm text-text-secondary">
                      {split.group.memberCount} members
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transaction Hash */}
        {split.txHash && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-text-secondary mb-3">
              BLOCKCHAIN TRANSACTION
            </h3>
            <Card>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-mono text-text-secondary break-all">
                      {truncateAddress(split.txHash, 8)}
                    </p>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${split.txHash}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary flex items-center gap-1"
                  >
                    <span className="text-sm">View</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        {canPay && (
          <Button
            onClick={handlePay}
            size="lg"
            className="w-full"
            isLoading={isPaying}
            disabled={isPaying}
          >
            {isPaying ? 'Processing...' : `Pay ${formatCurrency(myParticipation.amount)}`}
          </Button>
        )}

        {canCancel && (
          <Button
            onClick={handleCancel}
            size="lg"
            variant="danger"
            className="w-full mt-3"
          >
            Cancel Split
          </Button>
        )}
      </div>
    </Layout>
  )
}
