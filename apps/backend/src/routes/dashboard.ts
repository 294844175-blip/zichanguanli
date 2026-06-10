import { Router } from 'express';
import {
  getOverview,
  getRevenueTrend,
  getMultiParkSummary,
  getMonthlyTrendsData,
} from '../controllers/dashboardController';

const router = Router();

router.get('/overview', getOverview);
router.get('/revenue', getRevenueTrend);
router.get('/multi-park', getMultiParkSummary);
router.get('/monthly-trends', getMonthlyTrendsData);

export default router;
