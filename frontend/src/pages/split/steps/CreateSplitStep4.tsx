import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import { Avatar } from '../../../components/ui/Avatar'
import { Card, CardContent } from '../../../components/ui/Card'
import { useSplitStore } from '../../../store/splitStore'
import { useAuthStore } from '../../../store/authStore'
import { splitsApi, contactsApi, groupsApi } from '../../../lib/api'
import { Contact, Group } from '../../../types'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { Edit2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateSplitStep4() {
  const navigate = useNavigate()
  const { draft, previousStep, setStep, clearDraft } = useSplitStore()
  const { user } = useAuthStore()

  const [contacts, setContacts] = useState<Contact[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroupId, setSelectedGroupId] = useState(draft?.groupId || '')
  const [note, setNote] = useState(draft?.note || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [contactsRes, groupsRes] = await Promise.all([
        contactsApi.list(),
        groupsApi.list(),
      ])
      setContacts(contactsRes.data.data.contacts || [])
      setGroups(groupsRes.data.data.groups || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  if (!draft) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-text-secondary">No draft found</p>
      </div>
    )
  }

  const selectedContacts = contacts.filter((c) =>
    draft.selectedContacts.includes(c.userId)
  )

  const payer = draft.paidBy === user?.id
    ? { name: user.name || 'You', avatar: user.avatar }
    : selectedContacts.find((c) => c.userId === draft.paidBy)

  // Calculate participant amounts based on split type
  const getParticipantAmounts = () => {
    const amounts: Record<string, number> = {}
    const allParticipants = [...selectedContacts]

    if (draft.includeSelf && user) {
      allParticipants.push({
        userId: user.id,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        lastSplitDate: new Date().toISOString(),
      })
    }

    switch (draft.splitType) {
      case 'EQUAL':
        const perPerson = draft.amount / allParticipants.length
        allParticipants.forEach((p) => {
          amounts[p.userId] = parseFloat(perPerson.toFixed(2))
        })
        break

      case 'CUSTOM':
        Object.assign(amounts, draft.customAmounts || {})
        break

      case 'PERCENTAGE':
        if (draft.percentages) {
          Object.entries(draft.percentages).forEach(([userId, percent]) => {
            amounts[userId] = parseFloat(((draft.amount * percent) / 100).toFixed(2))
          })
        }
        break

      case 'EXACT':
        if (draft.contributions) {
          const fairShare = draft.amount / allParticipants.length
          allParticipants.forEach((p) => {
            const paid = draft.contributions?.[p.userId] || 0
            const owes = fairShare - paid
            if (owes > 0) {
              amounts[p.userId] = parseFloat(owes.toFixed(2))
            }
          })
        }
        break
    }

    return amounts
  }

  const participantAmounts = getParticipantAmounts()

  const handleSend = async () => {
    if (isSubmitting) return

    try {
      setIsSubmitting(true)

      // Prepare participants array for API
      const participants = Object.entries(participantAmounts).map(([userId, amount]) => ({
        userId,
        amount,
      }))

      const splitData = {
        amount: draft.amount,
        description: draft.description || undefined,
        splitType: draft.splitType,
        participants,
        groupId: selectedGroupId || undefined,
        note: note.trim() || undefined,
      }

      const response = await splitsApi.create(splitData)

      // Show success state
      setShowSuccess(true)
      clearDraft()

      // Navigate to split detail after a moment
      setTimeout(() => {
        navigate(`/split/${response.data.data.split.id}`)
      }, 2000)
    } catch (error: any) {
      console.error('Failed to create split:', error)
      toast.error(
        error.response?.data?.error?.message || 'Failed to create split'
      )
      setIsSubmitting(false)
    }
  }

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6">
        <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mb-4">
          <Check className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Split Created!</h2>
        <p className="text-text-secondary text-center">
          Requests sent to {draft.selectedContacts.length} {draft.selectedContacts.length === 1 ? 'person' : 'people'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Summary Card */}
        <Card>
          <CardContent className="py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-text-secondary mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-primary">
                {formatCurrency(draft.amount)}
              </p>
              {draft.description && (
                <p className="text-text-secondary mt-2">{draft.description}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">
                {formatDate(new Date().toISOString())}
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm font-medium">Edit amount</span>
              <Edit2 className="w-4 h-4 text-text-secondary" />
            </button>
          </CardContent>
        </Card>

        {/* Who Paid */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text-primary">Who Paid</h3>
            <button
              onClick={() => setStep(3)}
              className="text-sm text-primary font-medium"
            >
              Edit
            </button>
          </div>
          <Card>
            <CardContent className="py-3">
              <div className="flex items-center gap-3">
                <Avatar src={payer?.avatar} name={payer?.name} size="md" />
                <div>
                  <p className="font-medium">{payer?.name || 'Unknown'}</p>
                  <p className="text-sm text-text-secondary">
                    {formatCurrency(draft.amount)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Split Breakdown */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-text-primary">
              Split Breakdown
              <span className="text-sm text-text-secondary font-normal ml-2">
                ({draft.splitType.toLowerCase()})
              </span>
            </h3>
            <button
              onClick={() => setStep(3)}
              className="text-sm text-primary font-medium"
            >
              Edit
            </button>
          </div>
          <Card>
            <CardContent className="py-2">
              <div className="space-y-2">
                {Object.entries(participantAmounts).map(([userId, amount]) => {
                  const contact = userId === user?.id
                    ? { name: 'You', avatar: user.avatar }
                    : selectedContacts.find((c) => c.userId === userId)

                  if (!contact) return null

                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={contact.avatar}
                          name={contact.name}
                          size="sm"
                        />
                        <span className="font-medium">{contact.name}</span>
                      </div>
                      <span className="font-semibold text-primary">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add to Group (Optional) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Add to group (optional)
          </label>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            <option value="">No group</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Add Note (Optional) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Add a note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any additional details..."
            rows={3}
            maxLength={200}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
          />
          <p className="text-xs text-text-secondary text-right mt-1">
            {note.length}/200
          </p>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 border-t bg-white flex gap-3">
        <Button
          onClick={previousStep}
          variant="outline"
          size="lg"
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button
          onClick={handleSend}
          size="lg"
          className="flex-1"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send Requests'}
        </Button>
      </div>
    </div>
  )
}
