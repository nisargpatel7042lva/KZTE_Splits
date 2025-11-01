import { Router } from 'express'
import {
  listTransactionsHandler,
  getRecentTransactionsHandler,
  getTransactionHandler,
} from '../controllers/transactionController'
import { authenticateToken } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimit'

const router = Router()

// All transaction routes require authentication
router.use(authenticateToken)
router.use(apiLimiter)

router.get('/recent', getRecentTransactionsHandler)
router.get('/:id', getTransactionHandler)
router.get('/', listTransactionsHandler)

export default router
