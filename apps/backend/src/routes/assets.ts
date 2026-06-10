import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import {
  getAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetSlices,
  updateAssetSlices,
  getAssetCosts,
  createAssetCost,
  getAssetImages,
  uploadAssetImage,
  deleteAssetImage,
  exportAssets,
} from '../controllers/assetController';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', getAssets);
router.get('/export', exportAssets);
router.get('/slices/:parkId', getAssetSlices);
router.put('/slices/:parkId', updateAssetSlices);
router.get('/:id', getAssetById);
router.post('/', createAsset);
router.put('/:id', updateAsset);
router.delete('/:id', deleteAsset);
router.get('/:id/costs', getAssetCosts);
router.post('/:id/costs', createAssetCost);
router.get('/:id/images', getAssetImages);
router.post('/:id/images/upload', upload.single('file'), uploadAssetImage);
router.delete('/:id/images/:filename', deleteAssetImage);

export default router;
