import { Link, useLocation } from 'react-router-dom'
import { Home, Users, List, User } from 'lucide-react'
import { cn } from '../../lib/utils'

const navItems = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/groups', icon: Users, label: 'Groups' },
  { path: '/activity', icon: List, label: 'Activity' },
  { path: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 pb-safe">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-text-secondary'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'stroke-[2.5]')} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

