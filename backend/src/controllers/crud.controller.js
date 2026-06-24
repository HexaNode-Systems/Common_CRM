import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';

export function createCrudController(Model, options = {}) {
  const defaultSort = options.defaultSort || '-createdAt';

  return {
    list: asyncHandler(async (req, res) => {
      const page = Number(req.query.page || 1);
      const limit = Math.min(Number(req.query.limit || 20), 100);
      const skip = (page - 1) * limit;
      const filter = options.buildFilter ? options.buildFilter(req) : {};

      const [items, total] = await Promise.all([
        Model.find(filter).sort(defaultSort).skip(skip).limit(limit),
        Model.countDocuments(filter)
      ]);

      res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    }),

    get: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, 'Record not found');
      res.json(item);
    }),

    create: asyncHandler(async (req, res) => {
      const payload = options.beforeCreate ? await options.beforeCreate(req.body, req) : req.body;
      const item = await Model.create(payload);
      res.status(201).json(item);
    }),

    update: asyncHandler(async (req, res) => {
      const payload = options.beforeUpdate ? await options.beforeUpdate(req.body, req) : req.body;
      const item = await Model.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
      if (!item) throw new ApiError(404, 'Record not found');
      res.json(item);
    }),

    remove: asyncHandler(async (req, res) => {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) throw new ApiError(404, 'Record not found');
      res.json({ message: 'Deleted successfully' });
    })
  };
}

