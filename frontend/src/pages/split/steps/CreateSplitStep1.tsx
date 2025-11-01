import { useState, useEffect } from 'react'
import { Input } from '../../../components/ui/Input'
import { Button } from '../../../components/ui/Button'
import { useSplitStore } from '../../../store/splitStore'
import { useWalletStore } from '../../../store/walletStore'
import { formatCurrency } from '../../../lib/utils'
import { Camera } from 'lucide-react'

export default function CreateSplitStep1() {
  const { draft, saveDraft, nextStep } = useSplitStore()
  const { balance } = useWalletStore()

  const [amount, setAmount] = useState(draft?.amount?.toString() || '')
  const [description, setDescription] = useState(draft?.description || '')
  const [error, setError] = useState('')

  useEffect(() => {
    if (draft) {
      setAmount(draft.amount > 0 ? draft.amount.toString() : '')
      setDescription(draft.description || '')
    }
  }, [draft])

  const handleAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '')

    // Ensure only one decimal point
    const parts = cleaned.split('.')
    if (parts.length > 2) {
      return
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return
    }

    setAmount(cleaned)
    setError('')
  }

  const validateAndContinue = () => {
    const numAmount = parseFloat(amount)

    if (!amount || isNaN(numAmount)) {
      setError('Please enter a valid amount')
      return
    }

    if (numAmount < 10) {
      setError('Minimum split amount is 10 KZTE')
      return
    }

    if (numAmount > 1000000) {
      setError('Maximum split amount is 1,000,000 KZTE')
      return
    }

    if (numAmount > balance * 1.1) { // Allow 10% over balance for flexibility
      setError(`Amount exceeds your available balance (${formatCurrency(balance)})`)
      return
    }

    // Save draft and continue
    saveDraft({
      amount: numAmount,
      description: description.trim(),
    })

    nextStep()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndContinue()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2 text-center">
              How much?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-text-primary font-bold">
                ₸
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="0"
                autoFocus
                className="w-full text-5xl font-bold text-center py-6 px-4 pl-16 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            {error && (
              <p className="mt-2 text-sm text-error text-center">{error}</p>
            )}
            {!error && balance > 0 && (
              <p className="mt-2 text-sm text-text-secondary text-center">
                Available balance: {formatCurrency(balance)}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div>
            <Input
              label="What's it for?"
              placeholder="Dinner at Navat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyPress={handleKeyPress}
              helperText="Optional"
              className="text-lg"
            />
          </div>

          {/* Scan Receipt Button */}
          <button
            type="button"
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 rounded-xl text-text-secondary hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span>Scan receipt</span>
          </button>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="p-6 border-t bg-white">
        <Button
          onClick={validateAndContinue}
          size="lg"
          className="w-full"
          disabled={!amount || parseFloat(amount) < 10}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
