import { Router } from 'express'
import {
  listGroupsHandler,
  createGroupHandler,
  getGroupHandler,
  addGroupMemberHandler,
  removeGroupMemberHandler,
  getGroupBalancesHandler,
} from '../controllers/groupController'
import { authenticateToken } from '../middleware/auth'
import { apiLimiter } from '../middleware/rateLimit'

const router = Router()

// All group routes require authentication
router.use(authenticateToken)
router.use(apiLimiter)

router.get('/', listGroupsHandler)
router.post('/create', createGroupHandler)
router.get('/:id', getGroupHandler)
router.post('/:id/members', addGroupMemberHandler)
router.delete('/:id/members/:userId', removeGroupMemberHandler)
router.get('/:id/balances', getGroupBalancesHandler)

export default router
