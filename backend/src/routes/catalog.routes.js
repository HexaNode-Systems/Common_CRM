import { createCrudController } from '../controllers/crud.controller.js';
import { CatalogItem } from '../models/CatalogItem.js';
import { resourceRoutes } from './resourceRoutes.js';

const controller = createCrudController(CatalogItem, {
  buildFilter: (req) => (req.query.type ? { type: req.query.type } : {})
});

export default resourceRoutes(controller, 'catalog');

