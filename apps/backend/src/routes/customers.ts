import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getFollowUps,
  createFollowUp,
  matchProspect,
  exportCustomers,
} from '../controllers/customerController';

const router = Router();

router.get('/', getCustomers);
router.get('/export', exportCustomers);
router.post('/match', matchProspect);
router.get('/:id', getCustomerById);
router.post('/', createCustomer);
router.put('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);
router.get('/:id/follow-ups', getFollowUps);
router.post('/:id/follow-ups', createFollowUp);

export default router;
