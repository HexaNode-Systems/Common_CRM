import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import catalogRoutes from './routes/catalog.routes.js';
import orderRoutes from './routes/order.routes.js';
import leadRoutes from './routes/lead.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import enquiryRoutes from './routes/enquiry.routes.js';
import bannerRoutes from './routes/banner.routes.js';
import couponRoutes from './routes/coupon.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import reportRoutes from './routes/report.routes.js';
import roleRoutes from './routes/role.routes.js';
import taskRoutes from './routes/task.routes.js';
import vaultRoutes from './routes/vault.routes.js';
import storageRoutes from './routes/storage.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';
import payrollRoutes from './routes/payroll.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';

export const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL?.split(',') || '*', credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/storage', express.static('storage'));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/v1/leads', leadRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/v1/payroll', payrollRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/theme', settingsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/v1/roles', roleRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/v1/vault', vaultRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/v1/storage', storageRoutes);
app.use('/api/storage', storageRoutes);

app.use(notFound);
app.use(errorHandler);



