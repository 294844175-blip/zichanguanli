import express from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
} from '../controllers/buildingController';

const router = express.Router();

router.get('/', getBuildings);
router.get('/:id', getBuildingById);
router.post('/', createBuilding);
router.put('/:id', updateBuilding);
router.delete('/:id', deleteBuilding);

export default router;
