import { Router } from 'express';
import {
  getOrganizationTree,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../controllers/organizationController';

const router = Router();

router.get('/tree', getOrganizationTree);
router.post('/', createOrganization);
router.put('/:id', updateOrganization);
router.delete('/:id', deleteOrganization);

export default router;
