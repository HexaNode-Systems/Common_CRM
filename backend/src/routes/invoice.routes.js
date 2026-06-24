import { createCrudController } from '../controllers/crud.controller.js';
import { Invoice } from '../models/Invoice.js';
import { resourceRoutes } from './resourceRoutes.js';

export default resourceRoutes(createCrudController(Invoice), 'invoices');

