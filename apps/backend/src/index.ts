import express from 'express';
import cors from 'cors';
import * as path from 'path';
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import parkRoutes from './routes/parks';
import customerRoutes from './routes/customers';
import leaseRoutes from './routes/leases';
import dashboardRoutes from './routes/dashboard';
import alertRoutes from './routes/alerts';
import userRoutes from './routes/users';
import roleRoutes from './routes/roles';
import orgRoutes from './routes/organizations';
import revenueRoutes from './routes/revenue';
import cameraRoutes from './routes/cameras';
import buildingRoutes from './routes/buildings';
import floorRoutes from './routes/floors';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// 静态文件服务 - 确保在开发和编译后都能正常工作
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/parks', parkRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/leases', leaseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/cameras', cameraRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/floors', floorRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
