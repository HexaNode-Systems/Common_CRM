import { createCrudController } from '../controllers/crud.controller.js';
import { User } from '../models/User.js';
import { resourceRoutes } from './resourceRoutes.js';
import bcrypt from 'bcryptjs';

const controller = createCrudController(User, {
  beforeCreate: async (body) => body,
  beforeUpdate: async (body) => {
    if (!body.password) delete body.password;
    else body.password = await bcrypt.hash(body.password, 12);
    return body;
  }
});

export default resourceRoutes(controller, 'users');
