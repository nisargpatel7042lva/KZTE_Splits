import { Router } from 'express'
import {
  createSplitHandler,
  getSplitHandler,
  listSplitsHandler,
  paySplitHandler,
  cancelSplitHandler,
} from '../controllers/splitController'
import { authenticateToken } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimit'

const router = Router()

// All split routes require authentication
router.use(authenticateToken)
router.use(apiLimiter)

router.post('/create', createSplitHandler)
router.get('/:id', getSplitHandler)
router.get('/', listSplitsHandler)
router.post('/:id/pay', paySplitHandler)
router.put('/:id/cancel', cancelSplitHandler)

export default router
