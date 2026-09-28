// import { User } from '../models/User.js';
// import { CatalogItem } from '../models/CatalogItem.js';
// import { Order } from '../models/Order.js';
// import { Lead } from '../models/Lead.js';
// import { Payment } from '../models/Payment.js';
// import { Enquiry } from '../models/Enquiry.js';
// import { asyncHandler } from '../utils/asyncHandler.js';

// export const dashboardReport = asyncHandler(async (req, res) => {
//   const [
//     users,
//     products,
//     services,
//     orders,
//     leads,
//     payments,
//     enquiries,
//     revenue,
//     leadSources,
//     revenueTrend,
//     leadsTrend
//   ] = await Promise.all([
//     User.countDocuments(),
//     CatalogItem.countDocuments({ type: 'product' }),
//     CatalogItem.countDocuments({ type: 'service' }),
//     Order.countDocuments(),
//     Lead.countDocuments(),
//     Payment.countDocuments({ status: 'paid' }),
//     Enquiry.countDocuments(),
//     Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
//     Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
//     Payment.aggregate([
//       { $match: { status: 'paid' } },
//       { $group: { _id: { month: { $month: '$createdAt' } }, total: { $sum: '$amount' } } },
//       { $sort: { '_id.month': 1 } }
//     ]),
//     Lead.aggregate([
//       { $group: { _id: { month: { $month: '$createdAt' } }, total: { $sum: 1 } } },
//       { $sort: { '_id.month': 1 } }
//     ])
//   ]);

//   res.json({
//     users,
//     products,
//     services,
//     orders,
//     leads,
//     paidPayments: payments,
//     enquiries,
//     revenue: revenue[0]?.total || 0,
//     leadSources,
//     revenueTrend,
//     leadsTrend
//   });
// });


import { User } from '../models/User.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { Order } from '../models/Order.js';
import { Lead } from '../models/Lead.js';
import { Payment } from '../models/Payment.js';
import { Enquiry } from '../models/Enquiry.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Store the last result in memory for 30 seconds
let cache = { t: 0, data: null };
const TTL = 30_000;

export const dashboardReport = asyncHandler(async (req, res) => {
  // If we already have fresh data, send it right away (no database work)
  if (cache.data && Date.now() - cache.t < TTL) {
    return res.json(cache.data);
  }

  // Get the date 6 months ago (we only need 6 months for the charts)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  // Run all queries at the same time
  const [
    users,
    orders,
    leads,
    enquiries,
    catalogCounts,
    paymentTotals,
    leadSources,
    revenueTrend,
    leadsTrend
  ] = await Promise.all([
    // Fast count: reads the stored total, does not scan every document
    User.estimatedDocumentCount(),
    Order.estimatedDocumentCount(),
    Lead.estimatedDocumentCount(),
    Enquiry.estimatedDocumentCount(),

    // Count products and services in ONE query (before it was 2 queries)
    CatalogItem.aggregate([
      { $match: { type: { $in: ['product', 'service'] } } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),

    // Get paid payment count and total revenue in ONE query (before it was 2 queries)
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]),

    // Count leads by source
    Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),

    // Monthly revenue for the last 6 months only
    // We group by year AND month so Jan 2025 and Jan 2026 do not get mixed
    Payment.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // Monthly leads for the last 6 months only
    Lead.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  // Small helper to pick the count for "product" or "service"
  const countOf = (type) => catalogCounts.find((c) => c._id === type)?.count || 0;

  // Build the final response (same shape as before)
  const data = {
    users,
    products: countOf('product'),
    services: countOf('service'),
    orders,
    leads,
    paidPayments: paymentTotals[0]?.count || 0,
    enquiries,
    revenue: paymentTotals[0]?.total || 0,
    leadSources,
    revenueTrend,
    leadsTrend
  };

  // Save the result in the cache, then send it
  cache = { t: Date.now(), data };
  res.json(data);
});