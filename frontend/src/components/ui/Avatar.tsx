import { useState } from 'react'
import { User } from 'lucide-react'
import { cn, getInitials } from '../../lib/utils'

interface AvatarProps {
  src?: string | null
  alt?: string
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Avatar({ src, alt, name, size = 'md', className }: AvatarProps) {
  const [imageError, setImageError] = useState(false)

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl',
  }

  const showImage = src && !imageError

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden bg-primary/10',
        sizes[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : name ? (
        <span className="font-semibold text-primary">
          {getInitials(name)}
        </span>
      ) : (
        <User className="w-1/2 h-1/2 text-primary" />
      )}
    </div>
  )
}
