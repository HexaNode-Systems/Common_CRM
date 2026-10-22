import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Order } from '../models/Order.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { hasAccess } from '../middleware/auth.middleware.js';

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Header search. Each section only returns what the user could open from its own page:
// leads they own (all leads for Leads managers), projects they are on, and nothing from
// modules they have no access to.
export const globalSearch = async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim().slice(0, 100);
    if (!query) {
      return res.json({ users: [], leads: [], orders: [], products: [] });
    }

    const regex = new RegExp(escapeRegex(query), 'i');
    const user = req.user;
    const [canUsers, canLeads, leadManager, canOrders, canCatalog, catalogAll] = await Promise.all([
      hasAccess(user, 'users:read'),
      hasAccess(user, 'leads:read'),
      hasAccess(user, 'leads:delete'),
      hasAccess(user, 'orders:read'),
      hasAccess(user, 'catalog:read'),
      hasAccess(user, 'catalog:delete')
    ]);
    const none = Promise.resolve([]);

    const leadFilter = { $or: [{ companyName: regex }, { contactName: regex }, { phone: regex }, { email: regex }, { whatsapp: regex }] };
    const projectFilter = { $or: [{ title: regex }, { description: regex }, { sku: regex }, { 'client.name': regex }, { 'client.email': regex }, { 'client.phone': regex }] };

    const [users, leads, orders, products] = await Promise.all([
      canUsers
        ? User.find({ $or: [{ name: regex }, { email: regex }, { phone: regex }] }).limit(5).select('name email role profilePhoto')
        : none,
      canLeads || leadManager
        ? Lead.find(leadManager ? leadFilter : { $and: [leadFilter, { assignee: user._id }] }).limit(5).select('companyName contactName phone email status')
        : none,
      canOrders
        ? Order.find({ $or: [{ 'customerInfo.name': regex }, { 'customerInfo.email': regex }, { 'customerInfo.phone': regex }, { notes: regex }] }).limit(5).select('customerInfo total status createdAt')
        : none,
      CatalogItem.find(catalogAll
        ? projectFilter
        : { $and: [projectFilter, { $or: [{ 'assignedTeam.user': user._id }, { createdBy: user._id }] }] })
        .limit(5).select('title price sku type projectStatus')
    ]);

    res.json({ users, leads, orders, products: canCatalog || products.length ? products : [] });
  } catch (error) {
    next(error);
  }
};
