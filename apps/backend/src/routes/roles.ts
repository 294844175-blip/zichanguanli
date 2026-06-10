import { Router } from 'express';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  exportRoles,
} from '../controllers/roleController';

const router = Router();

router.get('/', getRoles);
router.get('/export', exportRoles);
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
