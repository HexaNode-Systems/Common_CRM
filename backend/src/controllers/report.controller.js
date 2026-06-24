import { User } from '../models/User.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Enquiry } from '../models/Enquiry.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardReport = asyncHandler(async (req, res) => {
  const [users, products, services, orders, payments, enquiries, revenue] = await Promise.all([
    User.countDocuments(),
    CatalogItem.countDocuments({ type: 'product' }),
    CatalogItem.countDocuments({ type: 'service' }),
    Order.countDocuments(),
    Payment.countDocuments({ status: 'paid' }),
    Enquiry.countDocuments(),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
  ]);

  res.json({
    users,
    products,
    services,
    orders,
    paidPayments: payments,
    enquiries,
    revenue: revenue[0]?.total || 0
  });
});

