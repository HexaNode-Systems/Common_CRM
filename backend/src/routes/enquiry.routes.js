import { createCrudController } from '../controllers/crud.controller.js';
import { Enquiry } from '../models/Enquiry.js';
import { resourceRoutes } from './resourceRoutes.js';

export default resourceRoutes(createCrudController(Enquiry), 'enquiries');

