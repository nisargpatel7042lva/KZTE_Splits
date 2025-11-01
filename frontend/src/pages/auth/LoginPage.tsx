import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { authApi } from '../../lib/api'
import { formatPhoneInput, validatePhone } from '../../lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft, Wallet } from 'lucide-react'

export default function LoginPage() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('+7')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value)
    setPhone(formatted)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate phone
    const cleanPhone = phone.replace(/\s/g, '')
    if (!validatePhone(cleanPhone)) {
      setError('Please enter a valid Kazakhstan phone number')
      return
    }

    setLoading(true)

    try {
      await authApi.sendOtp(cleanPhone)
      toast.success('OTP sent successfully!')
      navigate('/verify-otp', { state: { phone: cleanPhone } })
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to send OTP'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate('/welcome')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-primary rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Welcome back
            </h1>
            <p className="text-text-secondary">
              Enter your phone number to continue
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              type="tel"
              label="Phone Number"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 XXX XXX XXXX"
              error={error}
              maxLength={16}
              autoFocus
            />

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loading}
              disabled={phone.length < 16}
            >
              Send OTP
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-text-secondary">
            We'll send you a 6-digit verification code
          </p>
        </div>
      </div>
    </div>
  )
}
