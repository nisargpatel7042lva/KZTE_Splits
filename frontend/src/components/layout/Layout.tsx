import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface LayoutProps {
  children: ReactNode
  showBottomNav?: boolean
}

export function Layout({ children, showBottomNav = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main className={showBottomNav ? 'pb-16' : ''}>
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  )
}
