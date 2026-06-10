import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  toggleUserStatus,
  deleteUser,
  exportUsers,
  getUserParks,
  assignUserParks,
  removeUserPark,
} from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.get('/export', exportUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/status', toggleUserStatus);
router.delete('/:id', deleteUser);
router.get('/:id/parks', getUserParks);
router.post('/:id/parks', assignUserParks);
router.delete('/:id/parks/:parkId', removeUserPark);

export default router;
