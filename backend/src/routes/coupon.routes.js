import { createCrudController } from '../controllers/crud.controller.js';
import { Coupon } from '../models/Coupon.js';
import { resourceRoutes } from './resourceRoutes.js';

export default resourceRoutes(createCrudController(Coupon), 'coupons');

