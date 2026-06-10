import express from 'express';
import {
  getRevenueRecords,
  getRevenueRecordById,
  createRevenueRecord,
  updateRevenueRecord,
  deleteRevenueRecord,
} from '../controllers/revenueController';

const router = express.Router();

router.get('/', getRevenueRecords);
router.get('/:id', getRevenueRecordById);
router.post('/', createRevenueRecord);
router.put('/:id', updateRevenueRecord);
router.delete('/:id', deleteRevenueRecord);

export default router;
