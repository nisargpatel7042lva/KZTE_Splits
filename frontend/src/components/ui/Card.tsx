import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive'
  children: ReactNode
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-surface shadow-sm',
    elevated: 'bg-surface shadow-md',
    outlined: 'bg-surface border-2 border-gray-200',
    interactive: 'bg-surface shadow-sm hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-200',
  }

  return (
    <div
      className={cn(
        'rounded-xl',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 border-b border-gray-100', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-4 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  )
}
