import { Router } from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';

export function resourceRoutes(controller, permissionBase) {
  const router = Router();
  router.use(protect);
  router.get('/', authorize(`${permissionBase}:read`), controller.list);
  router.post('/', authorize(`${permissionBase}:create`), controller.create);
  router.get('/:id', authorize(`${permissionBase}:read`), controller.get);
  router.put('/:id', authorize(`${permissionBase}:update`), controller.update);
  router.delete('/:id', authorize(`${permissionBase}:delete`), controller.remove);
  return router;
}

