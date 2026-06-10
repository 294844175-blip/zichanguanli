import { Router } from 'express';
import { getCameras, createCamera, updateCamera, deleteCamera } from '../controllers/cameraController';

const router = Router();

router.get('/:parkId', getCameras);
router.post('/:parkId', createCamera);
router.put('/:id', updateCamera);
router.delete('/:id', deleteCamera);

export default router;
