import { createCrudController } from '../controllers/crud.controller.js';
import { Banner } from '../models/Banner.js';
import { resourceRoutes } from './resourceRoutes.js';

export default resourceRoutes(createCrudController(Banner, { defaultSort: 'order' }), 'banners');

