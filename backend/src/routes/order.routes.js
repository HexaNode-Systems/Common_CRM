import { createCrudController } from '../controllers/crud.controller.js';
import { Order } from '../models/Order.js';
import { resourceRoutes } from './resourceRoutes.js';

export default resourceRoutes(createCrudController(Order), 'orders');

