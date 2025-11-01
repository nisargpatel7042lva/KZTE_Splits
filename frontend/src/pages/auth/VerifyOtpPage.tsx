import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { formatPhoneNumber } from '../../lib/utils'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'

export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const phone = location.state?.phone as string

  const { setTokens, setUser } = useAuthStore()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if no phone
  useEffect(() => {
    if (!phone) {
      navigate('/login')
    }
  }, [phone, navigate])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)
    setError('')

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      handleVerify(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleVerify = async (otpCode?: string) => {
    const fullCode = otpCode || code.join('')
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authApi.verifyOtp(phone, fullCode)
      const { accessToken, refreshToken, user, requiresProfileSetup } = response.data.data

      setTokens(accessToken, refreshToken)
      setUser(user)

      toast.success('Login successful!')

      if (requiresProfileSetup) {
        navigate('/setup-profile')
      } else {
        navigate('/home')
      }
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Invalid OTP code'
      setError(message)
      toast.error(message)
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    try {
      await authApi.sendOtp(phone)
      toast.success('OTP sent successfully!')
      setResendTimer(30)
      setCode(['', '', '', '', '', ''])
      setError('')
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to resend OTP'
      toast.error(message)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4">
        <button
          onClick={() => navigate('/login')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Enter verification code
          </h1>
          <p className="text-text-secondary mb-8">
            Sent to {formatPhoneNumber(phone)}
          </p>

          {/* OTP Input */}
          <div className="flex justify-center gap-2 mb-4">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          {error && (
            <p className="text-sm text-error mb-4">{error}</p>
          )}

          {/* Resend */}
          <div className="mb-8">
            {resendTimer > 0 ? (
              <p className="text-sm text-text-secondary">
                Resend code in {resendTimer}s
              </p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-primary font-medium hover:underline"
              >
                Resend OTP
              </button>
            )}
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerify()}
            size="lg"
            className="w-full"
            loading={loading}
            disabled={code.join('').length !== 6}
          >
            Verify
          </Button>
        </div>
      </div>
    </div>
  )
}
