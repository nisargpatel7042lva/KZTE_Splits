import { Router } from 'express'
import {
  getBalanceHandler,
  getBalanceSummaryHandler,
  getWalletAddressHandler,
  getWalletTransactionsHandler,
  addFundsHandler,
  cashOutHandler,
} from '../controllers/walletController'
import { authenticateToken } from '../middleware/auth'
import { walletLimiter } from '../middleware/rateLimit'

const router = Router()

// All wallet routes require authentication
router.use(authenticateToken)
router.use(walletLimiter)

router.get('/balance', getBalanceHandler)
router.get('/summary', getBalanceSummaryHandler)
router.get('/address', getWalletAddressHandler)
router.get('/transactions', getWalletTransactionsHandler)
router.post('/add-funds', addFundsHandler)
router.post('/cash-out', cashOutHandler)

export default router
