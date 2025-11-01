import { useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Wallet, Users, Zap } from 'lucide-react'

export default function WelcomePage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: Zap,
      title: 'Split Bills Instantly',
      description: 'No more awkward money conversations. Split expenses in seconds with KZTE.',
    },
    {
      icon: Wallet,
      title: 'Free & Transparent',
      description: 'Powered by Solana blockchain. Fast, secure, and virtually free transactions.',
    },
    {
      icon: Users,
      title: 'Groups Made Easy',
      description: 'Manage recurring expenses with friends. Smart debt simplification included.',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-primary rounded-2xl flex items-center justify-center mb-4">
              <Wallet className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              KZTE Splits
            </h1>
            <p className="text-text-secondary">
              Split bills with friends using KZTE stablecoin
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 mb-12">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="text-center">
                  <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-text-primary mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-text-secondary">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>

          {/* CTA Button */}
          <Button
            onClick={() => navigate('/login')}
            size="lg"
            className="w-full"
          >
            Get Started
          </Button>

          <p className="mt-4 text-xs text-text-secondary">
            By continuing, you agree to our Terms & Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
