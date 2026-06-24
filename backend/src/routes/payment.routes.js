import { createCrudController } from '../controllers/crud.controller.js';
import { Payment } from '../models/Payment.js';
import { resourceRoutes } from './resourceRoutes.js';

export default resourceRoutes(createCrudController(Payment), 'payments');

