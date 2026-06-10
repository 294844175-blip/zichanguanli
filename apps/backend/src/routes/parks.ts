import { Router } from 'express';
import multer from 'multer';
import * as path from 'path';
import {
  getParks,
  getParkById,
  createPark,
  updatePark,
  updateParkBackground,
  uploadParkBackground,
  deleteParkBackground,
  updateParkBackgroundConfig,
} from '../controllers/parkController';

const router = Router();

// 配置multer存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../public/uploads'));
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.get('/', getParks);
router.get('/:id', getParkById);
router.post('/', createPark);
router.put('/:id', updatePark);
router.put('/:id/background', updateParkBackground);
router.post('/:id/background/upload', upload.single('file'), uploadParkBackground);
router.delete('/:id/background', deleteParkBackground);
router.put('/:id/background/config', updateParkBackgroundConfig);

export default router;
