import { SplitCalculation, DebtSimplification } from '../types'

/**
 * Round to 2 decimal places
 */
function roundToTwo(num: number): number {
  return Math.round(num * 100) / 100
}

/**
 * Calculate equal split among participants
 * Handles rounding by adjusting first participant's amount
 */
export function calculateEqualSplit(
  totalAmount: number,
  participants: string[],
  includeSelf: boolean = false
): SplitCalculation[] {
  const numParticipants = includeSelf
    ? participants.length + 1
    : participants.length

  const perPersonAmount = roundToTwo(totalAmount / numParticipants)
  const calculations: SplitCalculation[] = []

  // Assign equal amount to each participant
  for (const userId of participants) {
    calculations.push({
      userId,
      amount: perPersonAmount,
    })
  }

  // Handle rounding discrepancy
  const sum = calculations.reduce((acc, calc) => acc + calc.amount, 0)
  const difference = roundToTwo(totalAmount - sum)

  if (difference !== 0 && calculations.length > 0) {
    calculations[0].amount = roundToTwo(calculations[0].amount + difference)
  }

  return calculations
}

/**
 * Validate custom amounts
 * Ensures all amounts are positive and sum equals total
 */
export function validateCustomAmounts(
  totalAmount: number,
  customAmounts: Record<string, number>
): { valid: boolean; error?: string; difference?: number } {
  const amounts = Object.values(customAmounts)

  // Check all amounts are positive
  if (amounts.some((amount) => amount <= 0)) {
    return {
      valid: false,
      error: 'All amounts must be greater than 0',
    }
  }

  // Check sum equals total (with 0.01 tolerance)
  const sum = amounts.reduce((acc, amount) => acc + amount, 0)
  const difference = roundToTwo(totalAmount - sum)

  if (Math.abs(difference) > 0.01) {
    return {
      valid: false,
      error: `Amounts must total ${totalAmount} KZTE`,
      difference,
    }
  }

  return { valid: true }
}

/**
 * Calculate custom amounts split
 * Uses provided amounts as-is after validation
 */
export function calculateCustomSplit(
  totalAmount: number,
  customAmounts: Record<string, number>
): SplitCalculation[] {
  const validation = validateCustomAmounts(totalAmount, customAmounts)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  return Object.entries(customAmounts).map(([userId, amount]) => ({
    userId,
    amount: roundToTwo(amount),
  }))
}

/**
 * Validate percentages
 * Ensures all percentages are valid and sum to 100%
 */
export function validatePercentages(
  percentages: Record<string, number>
): { valid: boolean; error?: string; difference?: number } {
  const percentageValues = Object.values(percentages)

  // Check all percentages are between 0 and 100
  if (
    percentageValues.some((percentage) => percentage < 0 || percentage > 100)
  ) {
    return {
      valid: false,
      error: 'All percentages must be between 0 and 100',
    }
  }

  // Check sum equals 100% (with 0.01% tolerance)
  const sum = percentageValues.reduce((acc, percentage) => acc + percentage, 0)
  const difference = roundToTwo(100 - sum)

  if (Math.abs(difference) > 0.01) {
    return {
      valid: false,
      error: 'Percentages must total 100%',
      difference,
    }
  }

  return { valid: true }
}

/**
 * Calculate percentage-based split
 * Converts percentages to actual amounts
 */
export function calculatePercentageSplit(
  totalAmount: number,
  percentages: Record<string, number>
): SplitCalculation[] {
  const validation = validatePercentages(percentages)

  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const calculations: SplitCalculation[] = Object.entries(percentages).map(
    ([userId, percentage]) => ({
      userId,
      amount: roundToTwo((totalAmount * percentage) / 100),
    })
  )

  // Handle rounding discrepancy - assign to participant with highest percentage
  const sum = calculations.reduce((acc, calc) => acc + calc.amount, 0)
  const difference = roundToTwo(totalAmount - sum)

  if (difference !== 0 && calculations.length > 0) {
    // Find participant with highest percentage
    const maxEntry = Object.entries(percentages).reduce((max, entry) =>
      entry[1] > max[1] ? entry : max
    )
    const maxUserId = maxEntry[0]

    const calc = calculations.find((c) => c.userId === maxUserId)
    if (calc) {
      calc.amount = roundToTwo(calc.amount + difference)
    }
  }

  return calculations
}

/**
 * Calculate exact shares (who paid what)
 * Returns list of payments needed to settle
 */
export function calculateExactShares(
  totalAmount: number,
  contributions: Record<string, number>,
  participants: string[]
): DebtSimplification[] {
  // Calculate fair share for each person
  const fairShare = roundToTwo(totalAmount / participants.length)

  // Calculate balance for each person (positive = owed, negative = owes)
  const balances: Record<string, number> = {}

  for (const userId of participants) {
    const contributed = contributions[userId] || 0
    balances[userId] = roundToTwo(contributed - fairShare)
  }

  // Simplify debts
  return simplifyDebts(balances)
}

/**
 * Debt simplification algorithm
 * Minimizes number of transactions needed to settle balances
 */
export function simplifyDebts(
  balances: Record<string, number>
): DebtSimplification[] {
  const transactions: DebtSimplification[] = []

  // Separate creditors (owed money) and debtors (owe money)
  const creditors = Object.entries(balances)
    .filter(([_, balance]) => balance > 0)
    .sort((a, b) => b[1] - a[1]) // Sort descending

  const debtors = Object.entries(balances)
    .filter(([_, balance]) => balance < 0)
    .sort((a, b) => a[1] - b[1]) // Sort ascending

  let i = 0
  let j = 0

  while (i < creditors.length && j < debtors.length) {
    const [creditorId, creditorBalance] = creditors[i]
    const [debtorId, debtorBalance] = debtors[j]

    const settleAmount = Math.min(creditorBalance, Math.abs(debtorBalance))

    if (settleAmount > 0.01) {
      // Only create transaction if amount is significant
      transactions.push({
        from: debtorId,
        to: creditorId,
        amount: roundToTwo(settleAmount),
      })
    }

    // Update balances
    creditors[i][1] = roundToTwo(creditorBalance - settleAmount)
    debtors[j][1] = roundToTwo(debtorBalance + settleAmount)

    // Move to next creditor/debtor if balance is settled
    if (Math.abs(creditors[i][1]) < 0.01) i++
    if (Math.abs(debtors[j][1]) < 0.01) j++
  }

  return transactions
}

/**
 * Calculate group balances
 * Aggregates all splits in a group and simplifies debts
 */
export interface GroupSplit {
  paidBy: string
  participants: Array<{ userId: string; amount: number }>
}

export function calculateGroupBalances(
  splits: GroupSplit[]
): { balances: Record<string, number>; simplifiedTransactions: DebtSimplification[] } {
  const balances: Record<string, number> = {}

  // Aggregate balances from all splits
  for (const split of splits) {
    const { paidBy, participants } = split

    // Initialize balance if doesn't exist
    if (!balances[paidBy]) {
      balances[paidBy] = 0
    }

    for (const participant of participants) {
      if (!balances[participant.userId]) {
        balances[participant.userId] = 0
      }

      // Payer is owed money
      if (participant.userId !== paidBy) {
        balances[paidBy] = roundToTwo(balances[paidBy] + participant.amount)
        balances[participant.userId] = roundToTwo(
          balances[participant.userId] - participant.amount
        )
      }
    }
  }

  // Simplify debts
  const simplifiedTransactions = simplifyDebts(balances)

  return {
    balances,
    simplifiedTransactions,
  }
}

/**
 * Auto-distribute remaining amount among participants
 * Used in UI when user wants to quickly assign remaining balance
 */
export function autoDistributeRemaining(
  totalAmount: number,
  assignedAmounts: Record<string, number>,
  unassignedUserIds: string[]
): Record<string, number> {
  if (unassignedUserIds.length === 0) {
    return assignedAmounts
  }

  const assignedSum = Object.values(assignedAmounts).reduce(
    (acc, amount) => acc + amount,
    0
  )
  const remaining = roundToTwo(totalAmount - assignedSum)

  if (remaining <= 0) {
    return assignedAmounts
  }

  const perUser = roundToTwo(remaining / unassignedUserIds.length)
  const result = { ...assignedAmounts }

  // Assign equal amount to each unassigned user
  for (const userId of unassignedUserIds) {
    result[userId] = perUser
  }

  // Handle rounding discrepancy
  const newSum = Object.values(result).reduce((acc, amount) => acc + amount, 0)
  const difference = roundToTwo(totalAmount - newSum)

  if (difference !== 0 && unassignedUserIds.length > 0) {
    result[unassignedUserIds[0]] = roundToTwo(
      result[unassignedUserIds[0]] + difference
    )
  }

  return result
}
