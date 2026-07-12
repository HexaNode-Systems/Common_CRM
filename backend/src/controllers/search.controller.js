import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Order } from '../models/Order.js';
import { CatalogItem } from '../models/CatalogItem.js';

export const globalSearch = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      return res.json({ users: [], leads: [], orders: [], products: [] });
    }

    const regex = new RegExp(query, 'i');

    const [users, leads, orders, products] = await Promise.all([
      // Search Users
      User.find({
        $or: [{ name: regex }, { email: regex }, { phone: regex }]
      }).limit(5).select('name email role profilePhoto'),

      // Search Leads
      Lead.find({
        $or: [
          { companyName: regex },
          { contactName: regex },
          { phone: regex },
          { email: regex },
          { whatsapp: regex }
        ]
      }).limit(5).select('companyName contactName phone email status'),

      // Search Orders
      Order.find({
        $or: [
          { 'customerInfo.name': regex },
          { 'customerInfo.email': regex },
          { 'customerInfo.phone': regex },
          { notes: regex }
        ]
      }).limit(5).select('customerInfo total status createdAt'),

      // Search CatalogItems (Products/Projects/Services)
      CatalogItem.find({
        $or: [
          { title: regex },
          { description: regex },
          { sku: regex },
          { 'client.name': regex },
          { 'client.email': regex },
          { 'client.phone': regex }
        ]
      }).limit(5).select('title price sku type projectStatus')
    ]);

    res.json({
      users,
      leads,
      orders,
      products
    });
  } catch (error) {
    next(error);
  }
};
