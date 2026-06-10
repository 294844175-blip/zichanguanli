import { Router } from 'express';
import {
  getAlerts,
  getUnreadCount,
  markAsRead,
} from '../controllers/alertController';

const router = Router();

router.get('/', getAlerts);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', markAsRead);

export default router;
