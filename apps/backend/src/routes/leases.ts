import { Router } from 'express';
import {
  getLeases,
  getLeaseById,
  createLease,
  updateLease,
  getExpiringLeases,
  getOverdueLeases,
  exportLeases,
} from '../controllers/leaseController';

const router = Router();

router.get('/', getLeases);
router.get('/export', exportLeases);
router.get('/expiring', getExpiringLeases);
router.get('/overdue', getOverdueLeases);
router.get('/:id', getLeaseById);
router.post('/', createLease);
router.put('/:id', updateLease);

export default router;
