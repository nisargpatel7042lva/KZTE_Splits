import { Router } from 'express'
import { getContactsHandler } from '../controllers/contactController'
import { authenticateToken } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimit'

const router = Router()

// All contact routes require authentication
router.use(authenticateToken)
router.use(apiLimiter)

router.get('/', getContactsHandler)

export default router
