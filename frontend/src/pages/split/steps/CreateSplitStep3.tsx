import { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { Avatar } from '../../../components/ui/Avatar'
import { useSplitStore } from '../../../store/splitStore'
import { useAuthStore } from '../../../store/authStore'
import { contactsApi } from '../../../lib/api'
import { Contact, SplitType } from '../../../types'
import { formatCurrency, formatAmount } from '../../../lib/utils'
import toast from 'react-hot-toast'

export default function CreateSplitStep3() {
  const { draft, saveDraft, nextStep, previousStep } = useSplitStore()
  const { user } = useAuthStore()

  const [splitType, setSplitType] = useState<SplitType>(draft?.splitType || 'EQUAL')
  const [includeSelf, setIncludeSelf] = useState(draft?.includeSelf ?? false)
  const [paidBy, setPaidBy] = useState(draft?.paidBy || user?.id || '')
  const [customAmounts, setCustomAmounts] = useState<Record<string, number>>(
    draft?.customAmounts || {}
  )
  const [percentages, setPercentages] = useState<Record<string, number>>(
    draft?.percentages || {}
  )
  const [contributions, setContributions] = useState<Record<string, number>>(
    draft?.contributions || {}
  )
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    fetchSelectedContacts()
  }, [])

  const fetchSelectedContacts = async () => {
    try {
      const response = await contactsApi.list()
      const allContacts = response.data.data.contacts || []
      const selected = allContacts.filter((c: Contact) =>
        draft?.selectedContacts.includes(c.userId)
      )
      setContacts(selected)
    } catch (error) {
      console.error('Failed to fetch contacts:', error)
    }
  }

  const totalAmount = draft?.amount || 0
  const participants = [...contacts]
  if (includeSelf && user) {
    participants.push({
      userId: user.id,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      lastSplitDate: new Date().toISOString(),
    })
  }

  // Calculate equal split
  const calculateEqualSplit = () => {
    const count = participants.length
    if (count === 0) return {}
    const perPerson = totalAmount / count
    const amounts: Record<string, number> = {}
    let sum = 0

    participants.forEach((p, index) => {
      const amount = index === 0
        ? parseFloat((totalAmount - sum - perPerson * (count - 1)).toFixed(2))
        : parseFloat(perPerson.toFixed(2))
      amounts[p.userId] = amount
      sum += amount
    })

    return amounts
  }

  // Validate custom amounts
  const validateCustom = () => {
    const sum = Object.values(customAmounts).reduce((a, b) => a + b, 0)
    const diff = Math.abs(sum - totalAmount)
    return diff < 0.01
  }

  // Validate percentages
  const validatePercentages = () => {
    const sum = Object.values(percentages).reduce((a, b) => a + b, 0)
    return Math.abs(sum - 100) < 0.01
  }

  // Calculate percentage amounts
  const getPercentageAmounts = () => {
    const amounts: Record<string, number> = {}
    let sum = 0

    Object.entries(percentages).forEach(([userId, percent], index) => {
      if (index === Object.keys(percentages).length - 1) {
        // Last person gets remainder to avoid rounding errors
        amounts[userId] = parseFloat((totalAmount - sum).toFixed(2))
      } else {
        const amount = parseFloat(((totalAmount * percent) / 100).toFixed(2))
        amounts[userId] = amount
        sum += amount
      }
    })

    return amounts
  }

  const handleContinue = () => {
    let finalAmounts: Record<string, number> = {}
    let valid = true
    let errorMessage = ''

    switch (splitType) {
      case 'EQUAL':
        finalAmounts = calculateEqualSplit()
        break

      case 'CUSTOM':
        if (!validateCustom()) {
          const sum = Object.values(customAmounts).reduce((a, b) => a + b, 0)
          const diff = totalAmount - sum
          errorMessage = diff > 0
            ? `Amounts total ${formatCurrency(sum)}. Need ${formatCurrency(Math.abs(diff))} more.`
            : `Amounts total ${formatCurrency(sum)}. ${formatCurrency(Math.abs(diff))} over.`
          valid = false
        } else {
          finalAmounts = customAmounts
        }
        break

      case 'PERCENTAGE':
        if (!validatePercentages()) {
          const sum = Object.values(percentages).reduce((a, b) => a + b, 0)
          errorMessage = `Percentages total ${sum.toFixed(1)}%. Must equal 100%.`
          valid = false
        } else {
          finalAmounts = getPercentageAmounts()
        }
        break

      case 'EXACT':
        // For exact shares, contributions are stored separately
        const totalContributions = Object.values(contributions).reduce((a, b) => a + b, 0)
        if (Math.abs(totalContributions - totalAmount) > 0.01) {
          errorMessage = `Contributions total ${formatCurrency(totalContributions)}. Must equal ${formatCurrency(totalAmount)}.`
          valid = false
        } else {
          // Calculate fair shares
          const fairShare = totalAmount / participants.length
          finalAmounts = {}
          participants.forEach((p) => {
            const paid = contributions[p.userId] || 0
            const owes = fairShare - paid
            if (owes > 0) {
              finalAmounts[p.userId] = parseFloat(owes.toFixed(2))
            }
          })
        }
        break
    }

    if (!valid) {
      toast.error(errorMessage)
      return
    }

    if (!paidBy) {
      toast.error('Please select who paid')
      return
    }

    saveDraft({
      splitType,
      includeSelf,
      paidBy,
      customAmounts: splitType === 'CUSTOM' ? finalAmounts : undefined,
      percentages: splitType === 'PERCENTAGE' ? percentages : undefined,
      contributions: splitType === 'EXACT' ? contributions : undefined,
    })

    nextStep()
  }

  const renderSplitTypeContent = () => {
    switch (splitType) {
      case 'EQUAL':
        const equalAmounts = calculateEqualSplit()
        return (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar src={p.avatar} name={p.name} size="sm" />
                  <span className="font-medium">{p.name}</span>
                </div>
                <span className="font-semibold text-primary">
                  {formatCurrency(equalAmounts[p.userId] || 0)}
                </span>
              </div>
            ))}
          </div>
        )

      case 'CUSTOM':
        return (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar src={p.avatar} name={p.name} size="sm" />
                <span className="flex-1 font-medium">{p.name}</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">₸</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={customAmounts[p.userId] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setCustomAmounts({ ...customAmounts, [p.userId]: value })
                    }}
                    placeholder="0"
                    className="w-28 pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg mt-3">
              <span className="font-semibold">Total</span>
              <span className={`font-bold ${validateCustom() ? 'text-success' : 'text-error'}`}>
                {formatCurrency(Object.values(customAmounts).reduce((a, b) => a + b, 0))}
                {' / '}
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        )

      case 'PERCENTAGE':
        return (
          <div className="space-y-2">
            {participants.map((p) => (
              <div key={p.userId} className="space-y-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar src={p.avatar} name={p.name} size="sm" />
                  <span className="flex-1 font-medium">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      value={percentages[p.userId] || ''}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0
                        setPercentages({ ...percentages, [p.userId]: value })
                      }}
                      placeholder="0"
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-text-secondary">%</span>
                  </div>
                </div>
                {percentages[p.userId] > 0 && (
                  <div className="text-sm text-text-secondary text-right">
                    = {formatCurrency((totalAmount * (percentages[p.userId] || 0)) / 100)}
                  </div>
                )}
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg mt-3">
              <span className="font-semibold">Total</span>
              <span className={`font-bold ${validatePercentages() ? 'text-success' : 'text-error'}`}>
                {Object.values(percentages).reduce((a, b) => a + b, 0).toFixed(1)}% / 100%
              </span>
            </div>
          </div>
        )

      case 'EXACT':
        const totalContributions = Object.values(contributions).reduce((a, b) => a + b, 0)
        return (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Who paid what?</p>
            {participants.map((p) => (
              <div key={p.userId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Avatar src={p.avatar} name={p.name} size="sm" />
                <span className="flex-1 font-medium">{p.name}</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">₸</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={contributions[p.userId] || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      setContributions({ ...contributions, [p.userId]: value })
                    }}
                    placeholder="0"
                    className="w-28 pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-right focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
              <span className="font-semibold">Total Paid</span>
              <span className={`font-bold ${Math.abs(totalContributions - totalAmount) < 0.01 ? 'text-success' : 'text-error'}`}>
                {formatCurrency(totalContributions)} / {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Split Type Tabs */}
        <div className="grid grid-cols-4 gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setSplitType('EQUAL')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              splitType === 'EQUAL'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary'
            }`}
          >
            Equal
          </button>
          <button
            onClick={() => setSplitType('CUSTOM')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              splitType === 'CUSTOM'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary'
            }`}
          >
            Custom
          </button>
          <button
            onClick={() => setSplitType('PERCENTAGE')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              splitType === 'PERCENTAGE'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary'
            }`}
          >
            %
          </button>
          <button
            onClick={() => setSplitType('EXACT')}
            className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              splitType === 'EXACT'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary'
            }`}
          >
            Exact
          </button>
        </div>

        {/* Include Self Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Include me in split</span>
          <button
            onClick={() => setIncludeSelf(!includeSelf)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              includeSelf ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                includeSelf ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        {/* Split Type Content */}
        {renderSplitTypeContent()}

        {/* Who Paid Dropdown */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Who paid?
          </label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {user && (
              <option value={user.id}>{user.name} (You)</option>
            )}
            {contacts.map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="p-4 border-t bg-white flex gap-3">
        <Button onClick={previousStep} variant="outline" size="lg">
          Back
        </Button>
        <Button onClick={handleContinue} size="lg" className="flex-1">
          Next
        </Button>
      </div>
    </div>
  )
}
