import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'
import { authApi } from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function SetupProfilePage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuthStore()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters')
      return
    }

    if (name.trim().length > 50) {
      setError('Name must be less than 50 characters')
      return
    }

    setLoading(true)

    try {
      const response = await authApi.setupProfile(name.trim())
      const updatedUser = response.data.data.user

      setUser(updatedUser)
      toast.success('Profile setup complete!')
      navigate('/home')
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to setup profile'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Set up your profile
          </h1>
          <p className="text-text-secondary">
            Tell us your name to get started
          </p>
        </div>

        {/* Avatar Placeholder */}
        <div className="flex justify-center mb-8">
          <Avatar
            name={name || undefined}
            size="xl"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="text"
            label="First Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Enter your name"
            error={error}
            helperText={`${name.length}/50 characters`}
            maxLength={50}
            autoFocus
          />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            loading={loading}
            disabled={name.trim().length < 2}
          >
            Continue
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          You can update your profile later
        </p>
      </div>
    </div>
  )
}
