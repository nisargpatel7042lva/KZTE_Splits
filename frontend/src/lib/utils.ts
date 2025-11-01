import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format amount in KZTE currency
 */
export function formatAmount(amount: number): string {
  return new Intl.NumberFormat('kk-KZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(amount: number): string {
  return `₸${formatAmount(amount)}`
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // +7XXXXXXXXXX -> +7 XXX XXX XXXX
  if (phone.length === 12 && phone.startsWith('+7')) {
    return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`
  }
  return phone
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = now.getTime() - then.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(then)
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

/**
 * Truncate wallet address
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2 + 3) return address
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Validate Kazakhstan phone number
 */
export function validatePhone(phone: string): boolean {
  return /^\+7\d{10}$/.test(phone)
}

/**
 * Format phone number input (auto-format as user types)
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')

  // Always start with +7
  if (!digits.startsWith('7')) {
    return '+7'
  }

  // Format: +7 XXX XXX XXXX
  let formatted = '+7'
  if (digits.length > 1) {
    formatted += ' ' + digits.slice(1, 4)
  }
  if (digits.length > 4) {
    formatted += ' ' + digits.slice(4, 7)
  }
  if (digits.length > 7) {
    formatted += ' ' + digits.slice(7, 11)
  }

  return formatted
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy:', error)
    return false
  }
}
