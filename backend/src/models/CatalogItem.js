import mongoose from 'mongoose';

const catalogItemSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['product', 'service'], required: true, index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    shortDescription: String,
    images: [{ url: String, publicId: String }],
    price: { type: Number, default: 0 },
    salePrice: Number,
    sku: String,
    stock: { type: Number, default: 0 },
    duration: String,
    category: String,
    tags: [{ type: String }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    seo: {
      title: String,
      description: String,
      keywords: String
    }
  },
  { timestamps: true }
);

export const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);

