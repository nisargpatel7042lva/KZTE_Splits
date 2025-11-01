import { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/utils'

interface HeaderProps {
  title?: string
  showBack?: boolean
  right?: ReactNode
  className?: string
}

export function Header({ title, showBack, right, className }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className={cn('bg-surface border-b border-gray-200', className)}>
      <div className="max-w-lg mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {title && (
            <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  )
}
